import { supabase } from "@/integrations/supabase/client";

// === HELPER PARA CHAMADAS API ===
async function apiCall<T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: Record<string, unknown>
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error("Usuário não autenticado");
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "apikey": anonKey,
    "Authorization": `Bearer ${token}`,
  };

  const res = await fetch(`${supabaseUrl}/functions/v1/${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// === TIPOS ===
export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface RideResponse {
  success: boolean;
  ride_id: string;
  status: string;
  drivers_notified: number;
  message: string;
}

export interface RideDetail {
  success: boolean;
  ride: {
    id: string;
    status: string;
    origin_address: string;
    dest_address: string;
    passenger?: {
      full_name: string;
      phone: string;
    };
    driver?: {
      full_name: string;
      phone: string;
      vehicle_plate: string;
      vehicle_model: string;
      last_lat: number;
      last_lng: number;
    };
  };
}

// === 1. ONBOARDING (após signup) ===
export async function onboarding(fullName: string, phone?: string) {
  return apiCall("api-onboarding", "POST", {
    role: "passenger",
    full_name: fullName,
    phone: phone || null,
  });
}

// === 2. SOLICITAR CORRIDA ===
export async function requestRide(
  origin: Location,
  destination: Location,
  scheduledFor?: string | null
): Promise<RideResponse> {
  return apiCall("api-rides", "POST", {
    origin: {
      lat: origin.lat,
      lng: origin.lng,
      address: origin.address,
    },
    destination: {
      lat: destination.lat,
      lng: destination.lng,
      address: destination.address,
    },
    scheduled_for: scheduledFor || null,
  });
}

// === 3. ACOMPANHAR CORRIDA (Realtime) ===
export function subscribeToRide(
  rideId: string,
  callback: (status: string, payload: any) => void
) {
  return supabase
    .channel(`ride-${rideId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "rides", // Tabela correta
        filter: `id=eq.${rideId}`,
      },
      (payload) => {
        callback(payload.new.status, payload.new);
      }
    )
    .subscribe();
}

// === 4. CANCELAR CORRIDA ===
export async function cancelRide(rideId: string) {
  return apiCall("api-ride-status", "POST", {
    ride_id: rideId,
    status: "CANCELLED",
  });
}

// === 5. ATUALIZAR STATUS DA CORRIDA ===
export async function updateRideStatus(
  rideId: string,
  status: "ARRIVING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
) {
  return apiCall("api-ride-status", "POST", {
    ride_id: rideId,
    status,
  });
}

// === 6. DETALHES DA CORRIDA ===
export async function getRideDetail(rideId: string): Promise<RideDetail> {
  return apiCall(`api-ride-detail?ride_id=${rideId}`, "GET");
}

// === FLUXO DE STATUS ===
// MATCHING → ACCEPTED → ARRIVING → IN_PROGRESS → COMPLETED
// Qualquer estado pode ir para → CANCELLED
