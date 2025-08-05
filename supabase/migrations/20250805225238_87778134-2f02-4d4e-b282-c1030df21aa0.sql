
-- Create function to convert registration to application
CREATE OR REPLACE FUNCTION convert_registration_to_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if questionnaire_completed_at was just set (wasn't set before)
  IF OLD.questionnaire_completed_at IS NULL AND NEW.questionnaire_completed_at IS NOT NULL THEN
    
    -- Insert corresponding application record
    INSERT INTO yff_applications (
      individual_id,
      status,
      evaluation_status,
      answers,
      created_at,
      updated_at
    ) VALUES (
      NEW.individual_id,
      'submitted',
      'pending',
      jsonb_build_object(
        'team', jsonb_build_object(
          'ventureName', NEW.venture_name,
          'teamName', NEW.team_name,
          'numberOfMembers', NEW.number_of_team_members,
          'teamMembers', NEW.team_members,
          'industrySector', NEW.industry_sector,
          'website', NEW.website
        ),
        'personal', jsonb_build_object(
          'fullName', NEW.full_name,
          'email', NEW.email,
          'phoneNumber', NEW.phone_number,
          'linkedinProfile', NEW.linkedin_profile,
          'socialMediaHandles', NEW.social_media_handles,
          'dateOfBirth', NEW.date_of_birth,
          'gender', NEW.gender,
          'institutionName', NEW.institution_name,
          'courseProgram', NEW.course_program,
          'currentYearOfStudy', NEW.current_year_of_study,
          'expectedGraduation', NEW.expected_graduation,
          'currentCity', NEW.current_city,
          'state', NEW.state,
          'pinCode', NEW.pin_code,
          'permanentAddress', NEW.permanent_address
        ),
        'questionnaire_answers', NEW.questionnaire_answers
      ),
      NEW.questionnaire_completed_at,
      NOW()
    );
    
    -- Log the conversion
    RAISE NOTICE 'Converted registration % to application for individual %', NEW.id, NEW.individual_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically convert completed registrations
CREATE TRIGGER trigger_convert_registration_to_application
  AFTER UPDATE ON yff_team_registrations
  FOR EACH ROW
  EXECUTE FUNCTION convert_registration_to_application();

-- Convert any existing completed registrations that don't have applications yet
INSERT INTO yff_applications (
  individual_id,
  status,
  evaluation_status,
  answers,
  created_at,
  updated_at
)
SELECT DISTINCT
  ytr.individual_id,
  'submitted',
  'pending',
  jsonb_build_object(
    'team', jsonb_build_object(
      'ventureName', ytr.venture_name,
      'teamName', ytr.team_name,
      'numberOfMembers', ytr.number_of_team_members,
      'teamMembers', ytr.team_members,
      'industrySector', ytr.industry_sector,
      'website', ytr.website
    ),
    'personal', jsonb_build_object(
      'fullName', ytr.full_name,
      'email', ytr.email,
      'phoneNumber', ytr.phone_number,
      'linkedinProfile', ytr.linkedin_profile,
      'socialMediaHandles', ytr.social_media_handles,
      'dateOfBirth', ytr.date_of_birth,
      'gender', ytr.gender,
      'institutionName', ytr.institution_name,
      'courseProgram', ytr.course_program,
      'currentYearOfStudy', ytr.current_year_of_study,
      'expectedGraduation', ytr.expected_graduation,
      'currentCity', ytr.current_city,
      'state', ytr.state,
      'pinCode', ytr.pin_code,
      'permanentAddress', ytr.permanent_address
    ),
    'questionnaire_answers', ytr.questionnaire_answers
  ),
  ytr.questionnaire_completed_at,
  NOW()
FROM yff_team_registrations ytr
LEFT JOIN yff_applications ya ON ytr.individual_id = ya.individual_id
WHERE ytr.questionnaire_completed_at IS NOT NULL 
  AND ya.individual_id IS NULL;
