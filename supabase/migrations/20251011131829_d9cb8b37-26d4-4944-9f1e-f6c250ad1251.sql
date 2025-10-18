-- Create trades table
CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL,
  simbolo TEXT NOT NULL,
  pnl_neto DECIMAL(10, 2) NOT NULL,
  entrada DECIMAL(10, 2),
  salida DECIMAL(10, 2),
  cantidad DECIMAL(10, 2),
  notas TEXT,
  reglas_cumplidas BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  -- NUEVAS COLUMNAS AÑADIDAS --
  rr TEXT,
  ciclo_diario TEXT,
  induccion TEXT,
  liquidez TEXT,
  tipo_entrada TEXT,
  parcial_porcentaje NUMERIC,
  imagenes_urls TEXT[]
);

-- Create rules table
CREATE TABLE public.rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trades
CREATE POLICY "Users can view their own trades"
  ON public.trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades"
  ON public.trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades"
  ON public.trades FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades"
  ON public.trades FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for rules
CREATE POLICY "Users can view their own rules"
  ON public.rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rules"
  ON public.rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rules"
  ON public.rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rules"
  ON public.rules FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_trades_user_id ON public.trades(user_id);
CREATE INDEX idx_trades_fecha ON public.trades(fecha);
CREATE INDEX idx_trades_simbolo ON public.trades(simbolo);
CREATE INDEX idx_rules_user_id ON public.rules(user_id);