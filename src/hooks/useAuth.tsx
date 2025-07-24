
/**
 * @fileoverview Authentication Hook
 * 
 * Comprehensive authentication management with user profile handling,
 * sign-in/sign-up functionality, and database integration.
 * 
 * @version 2.0.0
 * @author 26ideas Development Team
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * User profile interface matching the individuals table structure
 */
interface UserProfile {
  individual_id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile?: string;
  city?: string;
  country?: string;
  country_code?: string;
  country_iso_code?: string;
  privacy_consent: boolean;
  data_processing_consent: boolean;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Authentication context interface
 */
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string, phoneNumber: string, countryCode: string, countryIsoCode: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 * 
 * Manages authentication state and provides context to child components
 * 
 * @param children - Child components to wrap
 * @returns JSX.Element - The authentication provider
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Log information about unused columns in the individuals table
   * This helps developers understand the database structure
   */
  const logUnusedColumns = () => {
    console.log('=== INDIVIDUALS TABLE COLUMN USAGE ===');
    console.log('mobile: Stores user phone number from registration');
    console.log('city: Stores user city for location-based features');
    console.log('country: Stores full country name for user profiles');
    console.log('country_code: Stores phone country code (e.g., +91) for proper phone formatting');
    console.log('country_iso_code: Stores ISO country code (e.g., IN) for country identification');
    console.log('email_verified: Tracks if user email has been verified (currently defaults to false)');
    console.log('is_active: Controls if user account is active (defaults to true)');
    console.log('privacy_consent: Required consent for GDPR compliance');
    console.log('data_processing_consent: Required consent for data processing');
    console.log('=====================================');
  };

  /**
   * Fetches user profile from the individuals table
   * 
   * @param email - User email to fetch profile for
   */
  const fetchUserProfile = async (email: string) => {
    try {
      console.log('Fetching user profile for email:', email);
      
      const { data, error } = await supabase
        .from('individuals')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        console.log('User profile fetched successfully:', data);
        setUserProfile(data);
        
        // Log unused columns info for developers
        logUnusedColumns();
      } else {
        console.log('No user profile found for email:', email);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setUserProfile(null);
    }
  };

  /**
   * Refreshes the current user's profile
   */
  const refreshProfile = async () => {
    if (user?.email) {
      await fetchUserProfile(user.email);
    }
  };

  /**
   * Initialize authentication state on component mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing authentication...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('User session found:', session.user.email);
          setUser(session.user);
          await fetchUserProfile(session.user.email!);
        } else {
          console.log('No user session found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setUser(session?.user ?? null);
        
        if (session?.user?.email) {
          await fetchUserProfile(session.user.email);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Sign in existing user
   * 
   * @param email - User email
   * @param password - User password
   */
  const signIn = async (email: string, password: string) => {
    console.log('Attempting to sign in user:', email);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }

    console.log('User signed in successfully');
  };

  /**
   * Sign up new user and create profile
   * 
   * @param email - User email
   * @param password - User password
   * @param firstName - User first name
   * @param lastName - User last name
   * @param phoneNumber - User phone number
   * @param countryCode - Country code for phone
   * @param countryIsoCode - ISO country code
   */
  const signUp = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string,
    phoneNumber: string,
    countryCode: string,
    countryIsoCode: string
  ) => {
    console.log('Attempting to sign up user:', email);

    // First create the auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Sign up error:', error);
      throw error;
    }

    console.log('Auth user created, now creating individual profile...');

    // Create individual profile
    const { error: profileError } = await supabase
      .from('individuals')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        mobile: phoneNumber,
        country_code: countryCode,
        country_iso_code: countryIsoCode,
        privacy_consent: true,
        data_processing_consent: true,
      });

    if (profileError) {
      console.error('Error creating individual profile:', profileError);
      throw profileError;
    }

    console.log('Individual profile created successfully');
    console.log('User signed up successfully');
  };

  /**
   * Sign out current user
   */
  const signOut = async () => {
    console.log('Signing out user...');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }

    setUser(null);
    setUserProfile(null);
    console.log('User signed out successfully');
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access authentication context
 * 
 * @returns AuthContextType - Authentication context values
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
