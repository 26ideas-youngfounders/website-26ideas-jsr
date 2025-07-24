-- Create individuals table for user profiles
CREATE TABLE public.individuals (
  individual_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  privacy_consent BOOLEAN NOT NULL DEFAULT false,
  data_processing_consent BOOLEAN NOT NULL DEFAULT false,
  country_code TEXT,
  country_iso_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'super_admin', 'yff_admin', 'mentor_admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  individual_id UUID REFERENCES public.individuals(individual_id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, individual_id, role)
);

-- Create YFF applications table
CREATE TABLE public.yff_applications (
  application_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  individual_id UUID REFERENCES public.individuals(individual_id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'submitted',
  cumulative_score INTEGER DEFAULT 0,
  reviewer_scores JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.individuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yff_applications ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
  )
$$;

-- RLS Policies for individuals
CREATE POLICY "Users can view all individuals" ON public.individuals FOR SELECT USING (true);
CREATE POLICY "Users can insert their own individual" ON public.individuals FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own individual" ON public.individuals FOR UPDATE USING (true);

-- RLS Policies for user_roles  
CREATE POLICY "Admins can view all user roles" ON public.user_roles 
FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can insert user roles" ON public.user_roles 
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for yff_applications
CREATE POLICY "Admins can view all applications" ON public.yff_applications 
FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'yff_admin'));

CREATE POLICY "Admins can update applications" ON public.yff_applications 
FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'yff_admin'));

CREATE POLICY "Users can insert applications" ON public.yff_applications FOR INSERT WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_individuals_updated_at
  BEFORE UPDATE ON public.individuals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_yff_applications_updated_at
  BEFORE UPDATE ON public.yff_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();