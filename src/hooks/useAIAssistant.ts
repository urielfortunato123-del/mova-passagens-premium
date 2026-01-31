import { useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

type Message = { role: 'user' | 'assistant'; content: string };

interface AIContext {
  currentPage: string;
  bookingsCount?: number;
  membershipLevel?: string;
}

interface Suggestion {
  text: string;
  action: 'navigate' | 'book' | 'info';
  target: string;
  icon: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mova-assistant`;

export function useAIAssistant() {
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getContext = useCallback((): AIContext => {
    const pageNames: Record<string, string> = {
      '/home': 'Início',
      '/schedule': 'Agendar Corrida',
      '/bookings': 'Minhas Corridas',
      '/payments': 'Pagamentos',
      '/profile': 'Perfil',
      '/benefits': 'MOVA+',
      '/partners': 'Parceiros',
      '/telephony': 'Telefonia',
      '/bradesco': 'Bradesco',
      '/live': 'Mapa ao Vivo',
      '/favorites': 'Favoritos',
    };
    
    return {
      currentPage: pageNames[location.pathname] || 'Início',
      membershipLevel: 'Prata', // TODO: Get from user context
      bookingsCount: 3, // TODO: Get from real data
    };
  }, [location.pathname]);

  const sendMessage = useCallback(async (input: string): Promise<void> => {
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    let assistantContent = '';
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          context: getContext(),
          type: 'chat',
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao conectar com o assistente');
      }

      if (!response.body) throw new Error('Sem resposta do servidor');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('AI Assistant error:', error);
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, getContext]);

  const fetchSuggestions = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'O que posso fazer agora?' }],
          context: getContext(),
          type: 'suggestions',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  }, [getContext]);

  const cancelResponse = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    suggestions,
    sendMessage,
    fetchSuggestions,
    cancelResponse,
    clearMessages,
    getContext,
  };
}
