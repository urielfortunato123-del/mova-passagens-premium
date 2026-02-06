import { createClient } from "@supabase/supabase-js";

// === CONFIGURAÇÃO MOVA BACKEND ===
const MOVA_SUPABASE_URL = "https://phmgsnnwrnnutupjtpll.supabase.co";
const MOVA_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobWdzbm53cm5udXR1cGp0cGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NTM1MTYsImV4cCI6MjA4NDMyOTUxNn0.-DxhL6zGiAMSI7A2v6XMAk8lIlq6ZXDnqGNECRHZRNk";

// Cliente Supabase para o backend MOVA
export const movaSupabase = createClient(MOVA_SUPABASE_URL, MOVA_SUPABASE_ANON_KEY);

// === HELPER PARA CHAMADAS API ===
async function apiCall<T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: Record<string, unknown>,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "apikey": MOVA_SUPABASE_ANON_KEY,
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${MOVA_SUPABASE_URL}/functions/v1/${endpoint}`, {
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

// Obtém o token do usuário logado no MOVA backend
export async function getMovaToken(): Promise<string | null> {
  const { data: { session } } = await movaSupabase.auth.getSession();
  return session?.access_token || null;
}

// === TIPOS ===
export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export type PaymentMethod = 'credit_card' | 'debit_card' | 'cash' | 'pix';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface RideResponse {
  success: boolean;
  ride_id: string;
  status: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
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
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
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
export async function onboarding(token: string, fullName: string, phone?: string) {
  return apiCall("api-onboarding", "POST", {
    role: "passenger",
    full_name: fullName,
    phone: phone || null,
  }, token);
}

// === 2. SOLICITAR CORRIDA COM PAGAMENTO ===
export async function requestRide(
  token: string,
  origin: Location,
  destination: Location,
  paymentMethod: PaymentMethod,
  paymentStatus: PaymentStatus = 'pending',
  scheduledFor?: string | null
): Promise<RideResponse> {
  return apiCall("api-rides", "POST", {
    origin,
    destination,
    payment_method: paymentMethod,
    payment_status: paymentStatus,
    scheduled_for: scheduledFor || null,
  }, token);
}

// === 3. ACOMPANHAR CORRIDA (Realtime) ===
export function subscribeToRide(
  rideId: string,
  callback: (ride: any) => void
) {
  return movaSupabase
    .channel(`ride-${rideId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "rides_v2",
        filter: `id=eq.${rideId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
}

// === 4. CANCELAR CORRIDA ===
export async function cancelRide(token: string, rideId: string) {
  return apiCall("api-ride-status", "POST", {
    ride_id: rideId,
    status: "CANCELLED",
  }, token);
}

// === 5. ATUALIZAR STATUS DA CORRIDA ===
export async function updateRideStatus(
  token: string,
  rideId: string,
  status: "ARRIVING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
) {
  return apiCall("api-ride-status", "POST", {
    ride_id: rideId,
    status,
  }, token);
}

// === 6. DETALHES DA CORRIDA ===
export async function getRideDetail(token: string, rideId: string): Promise<RideDetail> {
  return apiCall(`api-ride-detail?ride_id=${rideId}`, "GET", undefined, token);
}

// === OPÇÕES DE PAGAMENTO ===
// PIX: pagar ANTES (payment_status: 'paid')
// Crédito antecipado: pagar ANTES (payment_status: 'paid')
// Crédito no carro: pagar DEPOIS (payment_status: 'pending')
// Débito: pagar no carro (payment_status: 'pending')
// Dinheiro: pagar no carro (payment_status: 'pending')

// === FLUXO DE STATUS ===
// MATCHING → ACCEPTED → ARRIVING → IN_PROGRESS → COMPLETED
// Qualquer estado pode ir para → CANCELLED
