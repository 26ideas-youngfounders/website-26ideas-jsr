
-- Create table to store Typeform submissions
CREATE TABLE public.typeform_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  typeform_id text NOT NULL,
  submission_id text NOT NULL UNIQUE,
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamp with time zone NOT NULL,
  user_email text,
  user_identified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.typeform_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all submissions
CREATE POLICY "Admins can view all typeform submissions" 
  ON public.typeform_submissions 
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'yff_admin'::app_role));

-- Create policy for inserting submissions (for webhook)
CREATE POLICY "Allow webhook to insert typeform submissions" 
  ON public.typeform_submissions 
  FOR INSERT 
  WITH CHECK (true);

-- Add index for performance
CREATE INDEX idx_typeform_submissions_submitted_at ON public.typeform_submissions(submitted_at DESC);
CREATE INDEX idx_typeform_submissions_user_email ON public.typeform_submissions(user_email) WHERE user_email IS NOT NULL;

-- Enable real-time for the table
ALTER TABLE public.typeform_submissions REPLICA IDENTITY FULL;
