import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types';
import { useToast } from '@/hooks/use-toast';

function transformMessage(row: any): ChatMessage {
  return {
    id: row.id,
    bookingId: row.booking_id,
    sender: row.sender as 'driver' | 'passenger',
    message: row.message,
    timestamp: row.timestamp,
    read: row.read,
  };
}

export function useMessages(bookingId: string) {
  return useQuery({
    queryKey: ['messages', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booking_messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return (data || []).map(transformMessage);
    },
    enabled: !!bookingId,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });
}

export function useSendMessage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, message }: { bookingId: string; message: string }) => {
      const { error } = await supabase
        .from('booking_messages')
        .insert({
          booking_id: bookingId,
          sender: 'passenger',
          message,
        });

      if (error) throw error;
    },
    onSuccess: (_, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', bookingId] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar',
        description: error.message,
      });
    },
  });
}
