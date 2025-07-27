
import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        
        // Provide specific error messages
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Invalid email or password. Please check your credentials and try again.' };
        } else if (error.message.includes('Email not confirmed')) {
          return { error: 'Please verify your email address before signing in.' };
        } else if (error.message.includes('Too many requests')) {
          return { error: 'Too many sign-in attempts. Please wait a moment and try again.' };
        }
        
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      // First, sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
          },
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        
        // Provide specific error messages
        if (error.message.includes('already registered')) {
          return { error: 'This email is already registered. Please sign in instead.' };
        } else if (error.message.includes('Password should be at least')) {
          return { error: 'Password must be at least 6 characters long.' };
        } else if (error.message.includes('Invalid email')) {
          return { error: 'Please enter a valid email address.' };
        }
        
        return { error: error.message };
      }

      if (data.user) {
        // Create individual profile
        try {
          const { error: profileError } = await supabase
            .from('individuals')
            .insert({
              individual_id: data.user.id,
              first_name: firstName,
              last_name: lastName,
              email: email,
              privacy_consent: true,
              data_processing_consent: true,
              country_code: '+91',
              country_iso_code: 'IN',
              is_active: true,
              email_verified: false,
            });

          if (profileError) {
            console.error('Error creating individual profile:', profileError);
            // Don't fail the signup, just log the error
          } else {
            console.log('Individual profile created successfully');
          }
        } catch (profileError) {
          console.error('Error creating individual profile:', profileError);
          // Don't fail the signup, just log the error
        }
      }

      return {};
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
