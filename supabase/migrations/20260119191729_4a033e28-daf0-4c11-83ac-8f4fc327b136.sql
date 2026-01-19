-- Create booking status enum
CREATE TYPE public.booking_status AS ENUM (
  'requested',
  'confirmed',
  'enroute',
  'arrived',
  'in_progress',
  'completed',
  'cancelled'
);

-- Create passenger_profiles table
CREATE TABLE public.passenger_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  photo TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL REFERENCES public.passenger_profiles(id) ON DELETE CASCADE,
  driver_id UUID,
  pickup_time TIMESTAMPTZ NOT NULL,
  arrival_target_time TIMESTAMPTZ,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  estimated_value NUMERIC NOT NULL DEFAULT 0,
  final_value NUMERIC,
  status public.booking_status NOT NULL DEFAULT 'requested',
  driver_name TEXT,
  driver_phone TEXT,
  vehicle TEXT,
  plate TEXT,
  waiting_time INTEGER,
  waiting_value NUMERIC,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create favorite_addresses table
CREATE TABLE public.favorite_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL REFERENCES public.passenger_profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  lat NUMERIC,
  lng NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create booking_messages table
CREATE TABLE public.booking_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('driver', 'passenger')),
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  read BOOLEAN DEFAULT false
);

-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL REFERENCES public.passenger_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pix', 'card', 'wallet')),
  last4 TEXT,
  brand TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.passenger_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create helper function to get passenger_id from auth.uid()
CREATE OR REPLACE FUNCTION public.get_passenger_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.passenger_profiles WHERE user_id = auth.uid()
$$;

-- RLS Policies for passenger_profiles
CREATE POLICY "Users can view their own profile"
  ON public.passenger_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.passenger_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.passenger_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for bookings
CREATE POLICY "Passengers can view their own bookings"
  ON public.bookings FOR SELECT
  USING (passenger_id = public.get_passenger_id());

CREATE POLICY "Passengers can insert their own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (passenger_id = public.get_passenger_id());

CREATE POLICY "Passengers can update their own bookings"
  ON public.bookings FOR UPDATE
  USING (passenger_id = public.get_passenger_id());

-- RLS Policies for favorite_addresses
CREATE POLICY "Passengers can view their own favorites"
  ON public.favorite_addresses FOR SELECT
  USING (passenger_id = public.get_passenger_id());

CREATE POLICY "Passengers can insert their own favorites"
  ON public.favorite_addresses FOR INSERT
  WITH CHECK (passenger_id = public.get_passenger_id());

CREATE POLICY "Passengers can update their own favorites"
  ON public.favorite_addresses FOR UPDATE
  USING (passenger_id = public.get_passenger_id());

CREATE POLICY "Passengers can delete their own favorites"
  ON public.favorite_addresses FOR DELETE
  USING (passenger_id = public.get_passenger_id());

-- RLS Policies for booking_messages
CREATE POLICY "Passengers can view messages from their bookings"
  ON public.booking_messages FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings WHERE passenger_id = public.get_passenger_id()
    )
  );

CREATE POLICY "Passengers can insert messages to their bookings"
  ON public.booking_messages FOR INSERT
  WITH CHECK (
    booking_id IN (
      SELECT id FROM public.bookings WHERE passenger_id = public.get_passenger_id()
    )
    AND sender = 'passenger'
  );

-- RLS Policies for payment_methods
CREATE POLICY "Passengers can view their own payment methods"
  ON public.payment_methods FOR SELECT
  USING (passenger_id = public.get_passenger_id());

CREATE POLICY "Passengers can insert their own payment methods"
  ON public.payment_methods FOR INSERT
  WITH CHECK (passenger_id = public.get_passenger_id());

CREATE POLICY "Passengers can update their own payment methods"
  ON public.payment_methods FOR UPDATE
  USING (passenger_id = public.get_passenger_id());

CREATE POLICY "Passengers can delete their own payment methods"
  ON public.payment_methods FOR DELETE
  USING (passenger_id = public.get_passenger_id());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER on_passenger_profiles_updated
  BEFORE UPDATE ON public.passenger_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_bookings_updated
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();