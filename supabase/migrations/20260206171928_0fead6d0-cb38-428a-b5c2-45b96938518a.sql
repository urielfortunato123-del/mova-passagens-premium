-- Adicionar campos de pagamento na tabela rides
ALTER TABLE public.rides 
ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;

-- Criar constraint para validar payment_method
ALTER TABLE public.rides 
ADD CONSTRAINT rides_payment_method_check 
CHECK (payment_method IN ('credit', 'debit', 'cash', 'pix'));

-- Criar constraint para validar payment_status  
ALTER TABLE public.rides 
ADD CONSTRAINT rides_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'refunded'));

-- Comentários para documentação
COMMENT ON COLUMN public.rides.payment_method IS 'Método: credit, debit, cash, pix';
COMMENT ON COLUMN public.rides.payment_status IS 'Status: pending, paid, refunded';
COMMENT ON COLUMN public.rides.paid_at IS 'Timestamp quando foi pago (para pix/credit antes)';