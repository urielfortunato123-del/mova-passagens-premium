import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PaymentMethod, PaymentType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

function transformPayment(row: any): PaymentMethod {
  return {
    id: row.id,
    passengerId: row.passenger_id,
    type: row.type as PaymentType,
    last4: row.last4 || undefined,
    brand: row.brand || undefined,
    isDefault: row.is_default,
    createdAt: row.created_at || undefined,
  };
}

export function usePaymentMethods() {
  const { passengerProfile } = useAuth();

  return useQuery({
    queryKey: ['payments', passengerProfile?.id],
    queryFn: async () => {
      if (!passengerProfile?.id) return [];

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('passenger_id', passengerProfile.id)
        .order('is_default', { ascending: false });

      if (error) throw error;

      return (data || []).map(transformPayment);
    },
    enabled: !!passengerProfile?.id,
  });
}

export function useAddPaymentMethod() {
  const { passengerProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { type: PaymentType; last4?: string; brand?: string; isDefault?: boolean }) => {
      if (!passengerProfile?.id) throw new Error('Perfil não encontrado');

      // If setting as default, unset other defaults first
      if (data.isDefault) {
        await supabase
          .from('payment_methods')
          .update({ is_default: false })
          .eq('passenger_id', passengerProfile.id);
      }

      const { error } = await supabase
        .from('payment_methods')
        .insert({
          passenger_id: passengerProfile.id,
          type: data.type,
          last4: data.last4 || null,
          brand: data.brand || null,
          is_default: data.isDefault ?? false,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({
        title: 'Método adicionado!',
        description: 'O método de pagamento foi adicionado.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao adicionar',
        description: error.message,
      });
    },
  });
}

export function useSetDefaultPayment() {
  const { passengerProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!passengerProfile?.id) throw new Error('Perfil não encontrado');

      // Unset all defaults
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('passenger_id', passengerProfile.id);

      // Set new default
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({
        title: 'Padrão atualizado',
        description: 'O método de pagamento padrão foi atualizado.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: error.message,
      });
    },
  });
}

export function useDeletePaymentMethod() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({
        title: 'Método removido',
        description: 'O método de pagamento foi removido.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover',
        description: error.message,
      });
    },
  });
}
