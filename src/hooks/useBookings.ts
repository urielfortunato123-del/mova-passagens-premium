import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Booking, BookingStatus, ScheduleFormData } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { requestRide, getMovaToken, PaymentMethod, movaSupabase, onboarding } from '@/lib/api';
import { geocodeAddress } from '@/hooks/useGeocode';

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

// Pricing constants (shared with driver app)
const PRICING = {
  BASE_FARE: 5.00,
  PRICE_PER_KM: 2.00,
};

function estimatePrice(distanceKm: number): number {
  return Math.round((PRICING.BASE_FARE + distanceKm * PRICING.PRICE_PER_KM) * 100) / 100;
}

// Extended form data with payment info
export interface CreateRideData extends ScheduleFormData {
  paymentMethod: PaymentMethod;
  payBeforeRide: boolean;
}

export function useCreateBooking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRideData) => {
      const token = await getMovaToken();
      if (!token) throw new Error('Usuário não autenticado');

      // Get current user and check/create profile
      const { data: { user } } = await movaSupabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check if user has a passenger profile
      const { data: existingProfile } = await movaSupabase
        .from('users_profile')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingProfile) {
        // Create profile via onboarding
        console.log('Creating passenger profile before ride request...');
        const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Passageiro';
        await onboarding(token, userName);
        console.log('Profile created successfully');
      }

      // Geocode addresses to get coordinates
      const [originCoords, destCoords] = await Promise.all([
        geocodeAddress(data.pickupAddress),
        geocodeAddress(data.dropoffAddress),
      ]);

      if (!originCoords || !destCoords) {
        throw new Error('Não foi possível encontrar as coordenadas dos endereços');
      }

      const origin = {
        lat: originCoords.lat,
        lng: originCoords.lng,
        address: data.pickupAddress,
      };

      const destination = {
        lat: destCoords.lat,
        lng: destCoords.lng,
        address: data.dropoffAddress,
      };

      // Determine payment status based on method and pay before option
      const paymentStatus = (data.paymentMethod === 'pix' || data.payBeforeRide) ? 'paid' : 'pending';

      // Check if it's scheduled
      const isScheduled = data.pickupTime > new Date(Date.now() + 5 * 60 * 1000); // More than 5 min from now
      const scheduledFor = isScheduled ? data.pickupTime.toISOString() : null;

      const result = await requestRide(
        token,
        origin,
        destination,
        data.paymentMethod,
        paymentStatus,
        scheduledFor
      );

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['nextBooking'] });
      queryClient.invalidateQueries({ queryKey: ['activeRide'] });
      toast({
        title: 'Corrida solicitada!',
        description: result.drivers_notified > 0 
          ? `${result.drivers_notified} motoristas notificados`
          : 'Buscando motoristas próximos...',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao solicitar',
        description: error.message || 'Não foi possível solicitar a corrida.',
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
