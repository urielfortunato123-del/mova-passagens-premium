-- Create table for address history
CREATE TABLE public.address_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  passenger_id UUID NOT NULL REFERENCES public.passenger_profiles(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  lat NUMERIC,
  lng NUMERIC,
  used_count INTEGER NOT NULL DEFAULT 1,
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to avoid duplicate addresses per passenger
CREATE UNIQUE INDEX address_history_unique_address ON public.address_history (passenger_id, address);

-- Create index for faster lookups
CREATE INDEX address_history_passenger_lookup ON public.address_history (passenger_id, last_used_at DESC);

-- Enable Row Level Security
ALTER TABLE public.address_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Passengers can view their own address history"
ON public.address_history
FOR SELECT
USING (passenger_id = get_passenger_id());

CREATE POLICY "Passengers can insert their own address history"
ON public.address_history
FOR INSERT
WITH CHECK (passenger_id = get_passenger_id());

CREATE POLICY "Passengers can update their own address history"
ON public.address_history
FOR UPDATE
USING (passenger_id = get_passenger_id());

CREATE POLICY "Passengers can delete their own address history"
ON public.address_history
FOR DELETE
USING (passenger_id = get_passenger_id());

-- Function to upsert address history (insert or update if exists)
CREATE OR REPLACE FUNCTION public.upsert_address_history(
  p_address TEXT,
  p_lat NUMERIC DEFAULT NULL,
  p_lng NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_passenger_id UUID;
  v_id UUID;
BEGIN
  SELECT get_passenger_id() INTO v_passenger_id;
  
  IF v_passenger_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.address_history (passenger_id, address, lat, lng, used_count, last_used_at)
  VALUES (v_passenger_id, p_address, p_lat, p_lng, 1, now())
  ON CONFLICT (passenger_id, address)
  DO UPDATE SET
    used_count = address_history.used_count + 1,
    last_used_at = now(),
    lat = COALESCE(EXCLUDED.lat, address_history.lat),
    lng = COALESCE(EXCLUDED.lng, address_history.lng)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;