import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AddressHistoryItem {
  id: string;
  address: string;
  lat: number | null;
  lng: number | null;
  used_count: number;
  last_used_at: string;
}

export function useAddressHistory() {
  const queryClient = useQueryClient();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['address-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('address_history')
        .select('*')
        .order('last_used_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as AddressHistoryItem[];
    },
  });

  const addToHistory = useMutation({
    mutationFn: async ({ 
      address, 
      lat, 
      lng 
    }: { 
      address: string; 
      lat?: number; 
      lng?: number 
    }) => {
      const { data, error } = await supabase.rpc('upsert_address_history', {
        p_address: address,
        p_lat: lat ?? null,
        p_lng: lng ?? null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['address-history'] });
    },
  });

  const deleteFromHistory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('address_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['address-history'] });
    },
  });

  const clearHistory = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('address_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['address-history'] });
    },
  });

  // Filter history by search term
  const searchHistory = (term: string): AddressHistoryItem[] => {
    if (!term || term.length < 2) return history.slice(0, 5);
    const lowerTerm = term.toLowerCase();
    return history
      .filter(item => item.address.toLowerCase().includes(lowerTerm))
      .slice(0, 5);
  };

  return {
    history,
    isLoading,
    addToHistory,
    deleteFromHistory,
    clearHistory,
    searchHistory,
  };
}
