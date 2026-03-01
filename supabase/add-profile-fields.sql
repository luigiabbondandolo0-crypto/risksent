-- RiskSent: Add profile fields to app_user table
-- Run this in Supabase SQL Editor to enable profile functionality

-- Add profile columns to app_user
ALTER TABLE public.app_user 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS company text;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_app_user_updated_at ON public.app_user;
CREATE TRIGGER update_app_user_updated_at
    BEFORE UPDATE ON public.app_user
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions (if needed)
-- The RLS policies should already allow users to update their own records
