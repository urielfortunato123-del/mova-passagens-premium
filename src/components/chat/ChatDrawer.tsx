import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Send, X, User, Car } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMessages, useSendMessage } from '@/hooks/useChat';
import { cn } from '@/lib/utils';

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  driverName?: string;
}

export function ChatDrawer({ open, onOpenChange, bookingId, driverName }: ChatDrawerProps) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: messages = [] } = useMessages(bookingId);
  const sendMessage = useSendMessage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;

    await sendMessage.mutateAsync({ bookingId, message: message.trim() });
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Car className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <DrawerTitle className="text-left">
                  {driverName || 'Motorista'}
                </DrawerTitle>
                <p className="text-xs text-muted-foreground">Chat da corrida</p>
              </div>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="w-5 h-5" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhuma mensagem ainda</p>
              <p className="text-xs mt-1">Envie uma mensagem para o motorista</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isPassenger = msg.sender === 'passenger';
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex',
                    isPassenger ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2',
                      isPassenger
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-secondary text-secondary-foreground rounded-bl-md'
                    )}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p
                      className={cn(
                        'text-[10px] mt-1',
                        isPassenger ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}
                    >
                      {format(new Date(msg.timestamp), 'HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="flex-1 h-12"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendMessage.isPending}
              size="icon"
              className="h-12 w-12"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
