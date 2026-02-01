import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Mic, MicOff, MessageCircle, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { cn } from '@/lib/utils';

export function AIAssistantFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { 
    messages, 
    isLoading, 
    suggestions, 
    sendMessage, 
    fetchSuggestions,
    clearMessages 
  } = useAIAssistant();

  const {
    isListening,
    transcript,
    isSupported: isSpeechSupported,
    toggleListening,
    stopListening,
  } = useSpeechRecognition({
    onResult: (text) => {
      setInputValue(text);
      stopListening();
      handleSend(text);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      fetchSuggestions();
    }
  }, [isOpen, messages.length, fetchSuggestions]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText || isLoading) return;
    
    setInputValue('');
    await sendMessage(messageText);
  }, [inputValue, isLoading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: { action: string; target: string; text: string }) => {
    if (suggestion.action === 'navigate') {
      navigate(suggestion.target);
      setIsOpen(false);
    } else {
      sendMessage(suggestion.text);
    }
  };

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-28 right-4 z-40 w-14 h-14 rounded-full',
          'bg-primary text-primary-foreground shadow-lg',
          'flex items-center justify-center',
          'transition-all duration-300 hover:scale-110',
          'animate-bounce-subtle',
          isOpen && 'scale-0 opacity-0'
        )}
        aria-label="Abrir assistente MOVA"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed bottom-28 right-4 z-50 w-[calc(100vw-2rem)] max-w-md',
          'bg-card border border-border rounded-2xl shadow-2xl',
          'flex flex-col overflow-hidden',
          'transition-all duration-300 origin-bottom-right',
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        )}
        style={{ maxHeight: 'calc(100vh - 12rem)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">MOVA Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center text-muted-foreground py-4">
                <Sparkles className="w-10 h-10 mx-auto mb-2 text-primary" />
                <p className="font-medium">Olá! Sou o MOVA Assistant 👋</p>
                <p className="text-sm">Como posso ajudar você hoje?</p>
              </div>
              
              {suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Sugestões:</p>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-sm"
                    >
                      {suggestion.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] px-4 py-2 rounded-2xl text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-secondary text-secondary-foreground rounded-bl-md'
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))
          )}
          
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="bg-secondary text-secondary-foreground px-4 py-2 rounded-2xl rounded-bl-md">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Voice indicator */}
        {isListening && (
          <div className="px-4 py-2 bg-accent/10 border-t border-border">
            <p className="text-sm text-accent flex items-center gap-2">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              {transcript || 'Ouvindo...'}
            </p>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2">
            {isSpeechSupported && (
              <Button
                variant={isListening ? 'default' : 'ghost'}
                size="icon"
                onClick={toggleListening}
                className={cn(
                  'shrink-0',
                  isListening && 'bg-accent text-accent-foreground'
                )}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite ou use voz..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading}
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
