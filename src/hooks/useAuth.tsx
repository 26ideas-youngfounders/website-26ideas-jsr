
/**
 * @fileoverview Authentication hook and provider for the 26ideas Young Founders platform.
 * 
 * Provides a comprehensive authentication system using Supabase Auth with support for:
 * - Email/password authentication
 * - Social login (Google, Facebook)
 * - Session management
 * - Authentication state persistence
 * - Error handling and user feedback
 * - Graceful handling of missing profiles
 * 
 * This hook manages the entire authentication flow and provides a consistent
 * interface for all authentication-related operations throughout the application.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

// React Core and Hooks
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Supabase Authentication Types and Client
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// UI Feedback Hook
import { useToast } from '@/hooks/use-toast';

/**
 * User sign-up information interface
 */
interface UserSignUpInfo {
  firstName: string;
  lastName: string;
  privacyConsent: boolean;
  dataProcessingConsent: boolean;
  countryCode?: string;
  countryIsoCode?: string;
  phoneNumber?: string;
}

/**
 * User profile data from individuals table
 */
interface UserProfile {
  individual_id: string;
  first_name: string;
  last_name: string;
  email: string;
  country_code?: string;
  country_iso_code?: string;
  phone_number?: string;
  privacy_consent: boolean;
  data_processing_consent: boolean;
  is_active: boolean;
  email_verified: boolean;
}

/**
 * Authentication Context Type Definition
 * 
 * Defines the shape of the authentication context that will be available
 * to all components wrapped in the AuthProvider.
 */
interface AuthContextType {
  /** Current authenticated user object from Supabase */
  user: User | null;
  /** Current session object containing tokens and metadata */
  session: Session | null;
  /** User profile data from individuals table */
  userProfile: UserProfile | null;
  /** Loading state during authentication operations */
  loading: boolean;
  /** Function to initiate Google OAuth sign-in */
  signInWithGoogle: () => Promise<void>;
  /** Function to initiate Facebook OAuth sign-in */
  signInWithFacebook: () => Promise<void>;
  /** Function to register a new user with email/password */
  signUp: (email: string, password: string, userInfo?: UserSignUpInfo) => Promise<{ error: any }>;
  /** Function to sign in existing user with email/password */
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  /** Function to sign out the current user */
  signOut: () => Promise<void>;
}

/**
 * Authentication Context
 * React context for sharing authentication state across the application
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to access authentication context
 * 
 * Provides access to authentication state and functions from any component
 * within the AuthProvider tree. Includes built-in error checking to ensure
 * the hook is used correctly.
 * 
 * @throws {Error} When used outside of AuthProvider
 * @returns {AuthContextType} Authentication context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 * 
 * Wraps the application and provides authentication context to all child components.
 * Manages authentication state, handles auth state changes, and provides
 * authentication methods to the entire component tree.
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to wrap with auth context
 * @returns {JSX.Element} Provider component with authentication context
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Authentication state management
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Toast notifications for user feedback
  const { toast } = useToast();

  /**
   * Fetch user profile from individuals table
   * Now handles missing profiles gracefully
   */
  const fetchUserProfile = async (userId: string) => {
    try {
      // First try by individual_id
      let { data, error } = await supabase
        .from('individuals')
        .select('*')
        .eq('individual_id', userId)
        .maybeSingle();

      // If not found by individual_id, try by email (for backwards compatibility)
      if (!data && !error) {
        const user = await supabase.auth.getUser();
        if (user.data.user?.email) {
          const { data: dataByEmail, error: errorByEmail } = await supabase
            .from('individuals')
            .select('*')
            .eq('email', user.data.user.email)
            .maybeSingle();
          
          data = dataByEmail;
          error = errorByEmail;
        }
      }

      if (error && error.code !== 'PGRST116') {
        console.error("❌ Failed to fetch user profile:", error);
        setUserProfile(null);
        return;
      }

      if (data) {
        setUserProfile(data);
        console.log("✅ User profile loaded:", {
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          phoneNumber: data.phone_number
        });
      } else {
        console.log("⚠️ No user profile found for user:", userId);
        setUserProfile(null);
      }
    } catch (error) {
      console.error("❌ Error fetching user profile:", error);
      setUserProfile(null);
    }
  };

  /**
   * Effect hook to initialize authentication state and set up listeners
   * 
   * This effect:
   * 1. Sets up a listener for authentication state changes
   * 2. Checks for existing session on component mount
   * 3. Updates user and session state accordingly
   * 4. Manages loading state during initialization
   */
  useEffect(() => {
    // Set up auth state listener FIRST to catch all auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user profile when user signs in
        if (session?.user) {
          // Use setTimeout to defer Supabase calls and prevent deadlock
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session (for page refreshes)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      
      setLoading(false);
    });

    // Cleanup: unsubscribe from auth state changes
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Google OAuth Sign-In Function
   * 
   * Initiates the Google OAuth flow for user authentication.
   * Handles redirect URLs and OAuth-specific configuration.
   * 
   * @async
   * @function signInWithGoogle
   * @returns {Promise<void>} Promise that resolves when OAuth flow is initiated
   */
  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Redirect users back to home page after authentication
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline', // Request refresh token
            prompt: 'consent',      // Force consent screen for consistent experience
          },
        }
      });
      
      // Handle authentication errors
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      // Handle unexpected errors
      toast({
        title: "Error",
        description: "Failed to sign in with Google",
        variant: "destructive",
      });
    }
  };

  /**
   * Facebook OAuth Sign-In Function
   * 
   * Initiates the Facebook OAuth flow for user authentication.
   * Requests email permission to ensure we can identify users.
   * 
   * @async
   * @function signInWithFacebook
   * @returns {Promise<void>} Promise that resolves when OAuth flow is initiated
   */
  const signInWithFacebook = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          // Redirect users back to home page after authentication
          redirectTo: `${window.location.origin}/`,
          scopes: 'email', // Request email permission from Facebook
        }
      });
      
      // Handle authentication errors
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      // Handle unexpected errors
      toast({
        title: "Error",
        description: "Failed to sign in with Facebook",
        variant: "destructive",
      });
    }
  };

  /**
   * Email/Password Sign-Up Function
   * 
   * Creates a new user account with email and password.
   * Sends a confirmation email to verify the user's email address.
   * 
   * @async
   * @function signUp
   * @param {string} email - User's email address
   * @param {string} password - User's chosen password
   * @param {object} userInfo - Additional user information
   * @returns {Promise<{error: any}>} Promise with error object if sign-up fails
   */
  const signUp = async (email: string, password: string, userInfo?: UserSignUpInfo) => {
    // Validate required fields for individuals table
    if (userInfo) {
      if (!userInfo.firstName?.trim()) {
        const error = new Error("First name is required");
        console.error("❌ Sign-up validation failed:", error.message);
        toast({
          title: "Validation Error",
          description: "First name is required",
          variant: "destructive",
        });
        return { error };
      }

      if (!userInfo.lastName?.trim()) {
        const error = new Error("Last name is required");
        console.error("❌ Sign-up validation failed:", error.message);
        toast({
          title: "Validation Error",
          description: "Last name is required",
          variant: "destructive",
        });
        return { error };
      }

      if (!userInfo.privacyConsent) {
        const error = new Error("Privacy consent is required");
        console.error("❌ Sign-up validation failed:", error.message);
        toast({
          title: "Validation Error",
          description: "You must agree to the privacy policy",
          variant: "destructive",
        });
        return { error };
      }

      if (!userInfo.dataProcessingConsent) {
        const error = new Error("Data processing consent is required");
        console.error("❌ Sign-up validation failed:", error.message);
        toast({
          title: "Validation Error",
          description: "You must consent to data processing",
          variant: "destructive",
        });
        return { error };
      }

      // Check if email already exists in individuals table
      const { data: existingIndividual, error: checkError } = await supabase
        .from('individuals')
        .select('email')
        .eq('email', email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("❌ Error checking existing email:", checkError);
        toast({
          title: "Error",
          description: "Failed to validate email. Please try again.",
          variant: "destructive",
        });
        return { error: checkError };
      }

      if (existingIndividual) {
        const error = new Error("Email already exists");
        console.error("❌ Sign-up failed: Email already exists in individuals table:", email);
        toast({
          title: "Registration Error",
          description: "An account with this email address already exists",
          variant: "destructive",
        });
        return { error };
      }
    }

    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl // Where to redirect after email confirmation
      }
    });
    
    // Handle sign-up errors
    if (error) {
      console.error("❌ Supabase auth sign-up failed:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }

    // If userInfo is provided, create individuals record
    if (userInfo && data.user) {
      const { error: individualError } = await supabase
        .from('individuals')
        .insert({
          individual_id: data.user.id, // Use auth user ID as individual_id
          first_name: userInfo.firstName.trim(),
          last_name: userInfo.lastName.trim(),
          email: email,
          privacy_consent: userInfo.privacyConsent,
          data_processing_consent: userInfo.dataProcessingConsent,
          country_code: userInfo.countryCode || '+91', // Default to India
          country_iso_code: userInfo.countryIsoCode || 'IN', // Default to India
          phone_number: userInfo.phoneNumber || null, // Save phone number
          is_active: true,
          email_verified: false, // Will be updated when email is confirmed
        });

      if (individualError) {
        console.error("❌ Failed to create individuals record:", {
          error: individualError,
          userInfo,
          email
        });
        
        // Clean up the auth user if individual creation fails
        await supabase.auth.signOut();
        
        toast({
          title: "Registration Error",
          description: "Failed to complete registration. Please try again.",
          variant: "destructive",
        });
        return { error: individualError };
      }

      console.log("✅ Successfully created user and individual record:", {
        email,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        phoneNumber: userInfo.phoneNumber
      });

      toast({
        title: "Success",
        description: "Account created successfully! Please check your email to confirm your account.",
      });
    } else {
      // Success feedback - user needs to check email
      toast({
        title: "Success",
        description: "Please check your email to confirm your account",
      });
    }
    
    return { error: null };
  };

  /**
   * Email/Password Sign-In Function
   * 
   * Authenticates an existing user with their email and password.
   * Updates the authentication state automatically through the auth listener.
   * 
   * @async
   * @function signIn
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<{error: any}>} Promise with error object if sign-in fails
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Handle sign-in errors
    if (error) {
      // Check if the error message indicates an unregistered email
      if (error.message && 
          (error.message.includes("Invalid login credentials") || 
           error.message.includes("Invalid email or password"))) {
        // Add custom property to differentiate unregistered emails
        (error as any).isUserNotFound = true;
      }
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    
    return { error };
  };

  /**
   * Sign-Out Function
   * 
   * Signs out the current user and clears their session.
   * Authentication state is automatically updated through the auth listener.
   * 
   * @async
   * @function signOut
   * @returns {Promise<void>} Promise that resolves when sign-out is complete
   */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    // Handle sign-out errors (rare but possible)
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  /**
   * Authentication context value
   * Combines all authentication state and functions into a single object
   * that will be provided to all child components
   */
  const value = {
    user,
    session,
    userProfile,
    loading,
    signInWithGoogle,
    signInWithFacebook,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
