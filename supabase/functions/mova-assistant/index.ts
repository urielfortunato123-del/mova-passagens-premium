import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
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

Responda APENAS com um JSON válido, sem nenhum texto adicional:
[{"text": "texto curto", "action": "navigate", "target": "/path", "icon": "car"}]

Ícones disponíveis: car, gift, phone, credit-card, map, calendar`;
    }

    if (type === "voice") {
      systemPrompt += `\n\nO usuário está falando por voz. Responda de forma ainda mais concisa e natural, como em uma conversa.`;
    }

    // Use OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lovable.dev",
        "X-Title": "MOVA Passenger App",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: type === "chat",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Aguarde um momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Erro no assistente de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For suggestions, parse the response
    if (type === "suggestions") {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "[]";
      
      try {
        // Extract JSON from the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        return new Response(JSON.stringify({ suggestions }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        console.error("Failed to parse suggestions:", content);
        return new Response(JSON.stringify({ suggestions: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
