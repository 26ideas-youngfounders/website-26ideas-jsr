
-- First, let's check if there's already a foreign key column in yff_team_registrations
-- If not, we need to add it to link applications to registrations

-- Add application_id column to yff_team_registrations if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'yff_team_registrations' 
        AND column_name = 'application_id'
    ) THEN
        ALTER TABLE yff_team_registrations 
        ADD COLUMN application_id uuid REFERENCES yff_applications(application_id);
    END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_yff_team_registrations_application_id 
ON yff_team_registrations(application_id);

-- Update existing team registrations to link them to their corresponding applications
-- This matches based on individual_id (assuming that's the common link)
UPDATE yff_team_registrations 
SET application_id = (
    SELECT application_id 
    FROM yff_applications 
    WHERE yff_applications.individual_id = yff_team_registrations.individual_id
    LIMIT 1
)
WHERE application_id IS NULL;

-- Enable realtime for yff_team_registrations if not already enabled
ALTER TABLE yff_team_registrations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE yff_team_registrations;
