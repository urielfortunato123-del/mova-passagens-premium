import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Booking, BookingStatus, ScheduleFormData } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Helper to transform DB row to Booking type
function transformBooking(row: any): Booking {
  return {
    id: row.id,
    passengerId: row.passenger_id,
    driverId: row.driver_id || undefined,
    pickupTime: row.pickup_time,
    arrivalTargetTime: row.arrival_target_time || undefined,
    pickupAddress: row.pickup_address,
    dropoffAddress: row.dropoff_address,
    estimatedValue: parseFloat(row.estimated_value) || 0,
    finalValue: row.final_value ? parseFloat(row.final_value) : undefined,
    status: row.status as BookingStatus,
    driverName: row.driver_name || undefined,
    driverPhone: row.driver_phone || undefined,
    vehicle: row.vehicle || undefined,
    plate: row.plate || undefined,
    waitingTime: row.waiting_time || undefined,
    waitingValue: row.waiting_value ? parseFloat(row.waiting_value) : undefined,
    startedAt: row.started_at || undefined,
    completedAt: row.completed_at || undefined,
    cancelReason: row.cancel_reason || undefined,
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined,
  };
}

export function useBookings(statusFilter?: BookingStatus[]) {
  const { passengerProfile } = useAuth();

  return useQuery({
    queryKey: ['bookings', passengerProfile?.id, statusFilter],
    queryFn: async () => {
      if (!passengerProfile?.id) return [];

      let query = supabase
        .from('bookings')
        .select('*')
        .eq('passenger_id', passengerProfile.id)
        .order('pickup_time', { ascending: false });

      if (statusFilter && statusFilter.length > 0) {
        query = query.in('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(transformBooking);
    },
    enabled: !!passengerProfile?.id,
  });
}

export function useRecentBookings(limit: number = 3) {
  const { passengerProfile } = useAuth();

  return useQuery({
    queryKey: ['recentBookings', passengerProfile?.id, limit],
    queryFn: async () => {
      if (!passengerProfile?.id) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('passenger_id', passengerProfile.id)
        .in('status', ['completed', 'cancelled'])
        .order('pickup_time', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(transformBooking);
    },
    enabled: !!passengerProfile?.id,
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return transformBooking(data);
    },
    enabled: !!id,
  });
}

export function useNextBooking() {
  const { passengerProfile } = useAuth();

  return useQuery({
    queryKey: ['nextBooking', passengerProfile?.id],
    queryFn: async () => {
      if (!passengerProfile?.id) return null;

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('passenger_id', passengerProfile.id)
        .in('status', ['requested', 'confirmed', 'enroute', 'arrived', 'in_progress'])
        .order('pickup_time', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return transformBooking(data);
    },
    enabled: !!passengerProfile?.id,
  });
}

export function useActiveRide() {
  const { passengerProfile } = useAuth();

  return useQuery({
    queryKey: ['activeRide', passengerProfile?.id],
    queryFn: async () => {
      if (!passengerProfile?.id) return null;

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('passenger_id', passengerProfile.id)
        .in('status', ['enroute', 'arrived', 'in_progress'])
        .order('pickup_time', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return transformBooking(data);
    },
    enabled: !!passengerProfile?.id,
    refetchInterval: 5000, // Poll every 5 seconds for live updates
  });
}

// Mock price estimation (in production, this would be an Edge Function)
function estimatePrice(pickupAddress: string, dropoffAddress: string): number {
  // Simple mock: base fare + random multiplier
  const baseFare = 25;
  const multiplier = 1 + Math.random() * 2; // 1x to 3x
  return Math.round(baseFare * multiplier * 100) / 100;
}

export function useCreateBooking() {
  const { passengerProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      if (!passengerProfile?.id) throw new Error('Perfil não encontrado');

      const estimatedValue = estimatePrice(data.pickupAddress, data.dropoffAddress);

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          passenger_id: passengerProfile.id,
          pickup_address: data.pickupAddress,
          dropoff_address: data.dropoffAddress,
          pickup_time: data.pickupTime.toISOString(),
          arrival_target_time: data.arrivalTargetTime?.toISOString() || null,
          estimated_value: estimatedValue,
          status: 'requested',
        })
        .select()
        .single();

      if (error) throw error;

      return transformBooking(booking);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['nextBooking'] });
      toast({
        title: 'Corrida agendada!',
        description: 'Sua corrida foi agendada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao agendar',
        description: error.message || 'Não foi possível agendar a corrida.',
      });
    },
  });
}

export function useCancelBooking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancel_reason: reason || 'Cancelado pelo passageiro',
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['nextBooking'] });
      queryClient.invalidateQueries({ queryKey: ['activeRide'] });
      toast({
        title: 'Corrida cancelada',
        description: 'Sua corrida foi cancelada.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao cancelar',
        description: error.message,
      });
    },
  });
}
