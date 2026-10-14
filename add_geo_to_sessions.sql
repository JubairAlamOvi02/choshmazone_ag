-- Optional SQL migration to add Geo-Location & ISP columns to visitor_sessions
ALTER TABLE public.visitor_sessions
ADD COLUMN IF NOT EXISTS ip_address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS isp text;

-- Create index on city for regional analytics
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_city ON public.visitor_sessions(city);
