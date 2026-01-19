import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FavoriteAddress, FavoriteLabel } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

function transformFavorite(row: any): FavoriteAddress {
  return {
    id: row.id,
    passengerId: row.passenger_id,
    label: row.label as FavoriteLabel,
    address: row.address,
    lat: row.lat ? parseFloat(row.lat) : undefined,
    lng: row.lng ? parseFloat(row.lng) : undefined,
    createdAt: row.created_at || undefined,
  };
}

export function useFavorites() {
  const { passengerProfile } = useAuth();

  return useQuery({
    queryKey: ['favorites', passengerProfile?.id],
    queryFn: async () => {
      if (!passengerProfile?.id) return [];

      const { data, error } = await supabase
        .from('favorite_addresses')
        .select('*')
        .eq('passenger_id', passengerProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(transformFavorite);
    },
    enabled: !!passengerProfile?.id,
  });
}

export function useAddFavorite() {
  const { passengerProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { label: FavoriteLabel; address: string; lat?: number; lng?: number }) => {
      if (!passengerProfile?.id) throw new Error('Perfil não encontrado');

      const { error } = await supabase
        .from('favorite_addresses')
        .insert({
          passenger_id: passengerProfile.id,
          label: data.label,
          address: data.address,
          lat: data.lat || null,
          lng: data.lng || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast({
        title: 'Endereço salvo!',
        description: 'O endereço foi adicionado aos favoritos.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message,
      });
    },
  });
}

export function useDeleteFavorite() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('favorite_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast({
        title: 'Endereço removido',
        description: 'O endereço foi removido dos favoritos.',
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
