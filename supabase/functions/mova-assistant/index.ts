import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o MOVA Assistant, o assistente inteligente do aplicativo MOVA de transporte executivo.

Seu papel é ajudar os passageiros com:
1. **Agendamento de corridas**: Sugira destinos, horários e ajude a agendar viagens
2. **Programa MOVA+**: Explique benefícios, níveis (Bronze, Prata, Ouro, Diamante) e como ganhar pontos
3. **Parceiros e descontos**: Informe sobre parceiros (Renner, Cinemark, iFood, etc.) e seus benefícios
4. **Telefonia**: Explique os benefícios de operadoras (TIM, Claro, Vivo)
5. **Bradesco**: Ajude com KM Bradesco, parcelamento e resgates
6. **Navegação no app**: Guie o usuário para as diferentes seções

Contexto atual do usuário:
- Página atual: {currentPage}
- Corridas agendadas: {bookingsCount}
- Nível MOVA+: {membershipLevel}

Seja conciso, amigável e proativo. Use emojis ocasionalmente para tornar a conversa mais agradável.
Se o usuário pedir para fazer algo (agendar corrida, ver benefícios, etc.), responda com a ação sugerida.

Responda SEMPRE em português brasileiro.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context, type = "chat" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = SYSTEM_PROMPT
      .replace("{currentPage}", context?.currentPage || "Home")
      .replace("{bookingsCount}", context?.bookingsCount?.toString() || "0")
      .replace("{membershipLevel}", context?.membershipLevel || "Bronze");

    // Different prompts for different use cases
    if (type === "suggestions") {
      systemPrompt = `Você é o MOVA Assistant. Baseado no contexto do usuário, sugira 3 ações rápidas e úteis.
Página atual: ${context?.currentPage || "Home"}
Nível: ${context?.membershipLevel || "Bronze"}

Responda APENAS com um JSON array de 3 sugestões, cada uma com: { "text": "texto curto", "action": "navigate|book|info", "target": "/path ou descrição" }
Exemplo: [{"text": "Agendar corrida", "action": "navigate", "target": "/schedule"}]`;
    }

    if (type === "voice") {
      systemPrompt += `\n\nO usuário está falando por voz. Responda de forma ainda mais concisa e natural, como em uma conversa.`;
    }

    const body: Record<string, unknown> = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: type === "chat",
    };

    // Tool calling for suggestions
    if (type === "suggestions") {
      body.tools = [
        {
          type: "function",
          function: {
            name: "get_suggestions",
            description: "Return 3 quick action suggestions for the user",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      text: { type: "string", description: "Short action text" },
                      action: { type: "string", enum: ["navigate", "book", "info"] },
                      target: { type: "string", description: "Navigation path or description" },
                      icon: { type: "string", description: "Icon name: car, gift, phone, credit-card, map, calendar" }
                    },
                    required: ["text", "action", "target", "icon"],
                    additionalProperties: false
                  }
                }
              },
              required: ["suggestions"],
              additionalProperties: false
            }
          }
        }
      ];
      body.tool_choice = { type: "function", function: { name: "get_suggestions" } };
      body.stream = false;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Contate o suporte." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro no assistente de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For suggestions, parse the tool call response
    if (type === "suggestions") {
      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const suggestions = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify(suggestions), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For chat, stream the response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("mova-assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
