-- ============================================
-- MODELAGEM DO BANCO - SISTEMA MOVA UNIFICADO
-- ============================================

-- 1) Tabela unificada de perfis (passageiros e motoristas)
CREATE TABLE IF NOT EXISTS public.users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('passenger', 'driver')),
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2) Tabela de perfis de motoristas
CREATE TABLE IF NOT EXISTS public.driver_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users_profile(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT false,
  last_lat DOUBLE PRECISION,
  last_lng DOUBLE PRECISION,
  last_seen TIMESTAMPTZ,
  vehicle_plate TEXT,
  vehicle_model TEXT,
  vehicle_year INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3) Tabela de corridas
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL REFERENCES public.users_profile(id),
  driver_id UUID REFERENCES public.users_profile(id),
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'MATCHING', 'ACCEPTED', 'ARRIVING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  origin_address TEXT NOT NULL,
  dest_lat DOUBLE PRECISION NOT NULL,
  dest_lng DOUBLE PRECISION NOT NULL,
  dest_address TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ,
  price_cents INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4) Tabela de eventos (auditoria)
CREATE TABLE IF NOT EXISTS public.ride_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5) Tabela de ofertas para motoristas
CREATE TABLE IF NOT EXISTS public.ride_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.users_profile(id),
  status TEXT NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'ACCEPTED', 'EXPIRED')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_rides_passenger_id ON public.rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_ride_offers_driver_status ON public.ride_offers(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_ride_offers_ride_id ON public.ride_offers(ride_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_online ON public.driver_profiles(is_online) WHERE is_online = true;

-- ============================================
-- TRIGGER PARA ATUALIZAR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_rides_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_rides_updated_at ON public.rides;
CREATE TRIGGER trigger_rides_updated_at
  BEFORE UPDATE ON public.rides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rides_updated_at();

-- ============================================
-- FUNÇÃO PARA CALCULAR DISTÂNCIA (HAVERSINE)
-- ============================================
CREATE OR REPLACE FUNCTION public.haversine_distance(
  lat1 DOUBLE PRECISION,
  lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lng2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  r DOUBLE PRECISION := 6371; -- Raio da Terra em km
  dlat DOUBLE PRECISION;
  dlng DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  a := sin(dlat / 2) ^ 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ^ 2;
  c := 2 * asin(sqrt(a));
  RETURN r * c;
END;
$$;

-- ============================================
-- FUNÇÃO PARA BUSCAR MOTORISTAS PRÓXIMOS
-- ============================================
CREATE OR REPLACE FUNCTION public.find_nearby_drivers(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  driver_id UUID,
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dp.user_id,
    public.haversine_distance(p_lat, p_lng, dp.last_lat, dp.last_lng) as distance_km
  FROM public.driver_profiles dp
  WHERE dp.is_online = true
    AND dp.last_seen > now() - interval '2 minutes'
    AND dp.last_lat IS NOT NULL
    AND dp.last_lng IS NOT NULL
  ORDER BY distance_km ASC
  LIMIT p_limit;
END;
$$;

-- ============================================
-- ATIVAR RLS EM TODAS AS TABELAS
-- ============================================
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_offers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - users_profile
-- ============================================
CREATE POLICY "Users can view own profile"
  ON public.users_profile FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.users_profile FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.users_profile FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================
-- RLS POLICIES - driver_profiles
-- ============================================
CREATE POLICY "Drivers can view own profile"
  ON public.driver_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Drivers can update own profile"
  ON public.driver_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Drivers can insert own profile"
  ON public.driver_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- RLS POLICIES - rides
-- ============================================
CREATE POLICY "Passengers can view own rides"
  ON public.rides FOR SELECT
  USING (passenger_id = auth.uid());

CREATE POLICY "Drivers can view assigned rides"
  ON public.rides FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Passengers can create rides"
  ON public.rides FOR INSERT
  WITH CHECK (passenger_id = auth.uid());

CREATE POLICY "Participants can update rides"
  ON public.rides FOR UPDATE
  USING (passenger_id = auth.uid() OR driver_id = auth.uid());

-- ============================================
-- RLS POLICIES - ride_events
-- ============================================
CREATE POLICY "Participants can view ride events"
  ON public.ride_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rides r
      WHERE r.id = ride_events.ride_id
      AND (r.passenger_id = auth.uid() OR r.driver_id = auth.uid())
    )
  );

-- ============================================
-- RLS POLICIES - ride_offers
-- ============================================
CREATE POLICY "Drivers can view own offers"
  ON public.ride_offers FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can update own offers"
  ON public.ride_offers FOR UPDATE
  USING (driver_id = auth.uid() AND status = 'SENT');

-- ============================================
-- HABILITAR REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_profiles;