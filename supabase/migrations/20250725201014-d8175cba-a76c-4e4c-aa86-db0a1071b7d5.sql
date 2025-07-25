
-- Create a new migration to add unique constraint to yff_team_registration_autosave
-- This ensures each individual can only have one autosave record
ALTER TABLE yff_team_registration_autosave 
ADD CONSTRAINT yff_team_registration_autosave_individual_id_unique 
UNIQUE (individual_id);
