
-- Add new columns to yff_team_registrations table for team, venture, and referral information
ALTER TABLE yff_team_registrations 
ADD COLUMN team_name TEXT,
ADD COLUMN number_of_team_members INTEGER DEFAULT 1 CHECK (number_of_team_members >= 1 AND number_of_team_members <= 4),
ADD COLUMN team_members JSONB DEFAULT '[]'::jsonb,
ADD COLUMN venture_name TEXT,
ADD COLUMN industry_sector TEXT,
ADD COLUMN website TEXT,
ADD COLUMN referral_id TEXT;

-- Create storage bucket for ID card uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'yff-id-cards',
  'yff-id-cards',
  false,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
);

-- Create storage policies for ID card uploads
CREATE POLICY "Users can upload their own ID cards"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'yff-id-cards' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own ID cards"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'yff-id-cards' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all ID cards"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'yff-id-cards' AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'super_admin'::app_role) OR 
   has_role(auth.uid(), 'yff_admin'::app_role))
);

-- Create autosave table for form data
CREATE TABLE yff_team_registration_autosave (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on autosave table
ALTER TABLE yff_team_registration_autosave ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for autosave
CREATE POLICY "Users can manage their own autosave data"
ON yff_team_registration_autosave FOR ALL
USING (individual_id = auth.uid());

-- Add trigger to update updated_at column
CREATE TRIGGER update_yff_team_registration_autosave_updated_at
  BEFORE UPDATE ON yff_team_registration_autosave
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
