-- Create games table for stateful chess API
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fen TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'continue',
  side_to_move TEXT NOT NULL,
  winner TEXT,
  reason TEXT,
  legal_moves TEXT[] NOT NULL DEFAULT '{}',
  move_history TEXT[] NOT NULL DEFAULT '{}',
  white_player TEXT,
  black_player TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Allow public read access to games
CREATE POLICY "Games are publicly readable"
  ON public.games
  FOR SELECT
  USING (true);

-- Allow public insert access to games
CREATE POLICY "Games are publicly insertable"
  ON public.games
  FOR INSERT
  WITH CHECK (true);

-- Allow public update access to games
CREATE POLICY "Games are publicly updatable"
  ON public.games
  FOR UPDATE
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_games_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_games_updated_at();