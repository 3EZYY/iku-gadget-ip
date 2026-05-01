
-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create journal table
CREATE TABLE public.journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  nama_seller TEXT NOT NULL,
  jenis_unit TEXT NOT NULL DEFAULT 'HP',
  nama_unit TEXT NOT NULL,
  harga_jual NUMERIC NOT NULL DEFAULT 0,
  harga_beli NUMERIC NOT NULL DEFAULT 0,
  biaya_operasional NUMERIC NOT NULL DEFAULT 0,
  keterangan_biaya TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journal ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own journal" ON public.journal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own journal" ON public.journal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own journal" ON public.journal FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own journal" ON public.journal FOR DELETE USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_journal_updated_at BEFORE UPDATE ON public.journal FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
