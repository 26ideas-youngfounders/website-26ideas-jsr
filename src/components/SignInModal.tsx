
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Enhanced SignInModal with immediate error feedback and account existence checking
 */
const SignInModal = ({ isOpen, onClose, onSuccess }: SignInModalProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [countryIsoCode, setCountryIsoCode] = useState("IN");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle, signInWithFacebook, signUp, signIn } = useAuth();

  useEffect(() => {
    if (isOpen) {
      console.log("🔍 SignInModal: Enhanced error handling and feedback system active");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  /**
   * Enhanced email/password authentication with immediate error feedback
   */
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        // Validate required fields for sign-up
        if (!firstName.trim()) {
          console.error("❌ Sign-up validation failed: Missing first name");
          toast({
            title: "Validation Error",
            description: "First name is required",
            variant: "destructive",
          });
          return;
        }
        
        if (!lastName.trim()) {
          console.error("❌ Sign-up validation failed: Missing last name");
          toast({
            title: "Validation Error", 
            description: "Last name is required",
            variant: "destructive",
          });
          return;
        }
        
        if (!privacyConsent) {
          console.error("❌ Sign-up validation failed: Privacy consent not given");
          toast({
            title: "Validation Error",
            description: "You must agree to the privacy policy",
            variant: "destructive",
          });
          return;
        }
        
        if (!dataProcessingConsent) {
          console.error("❌ Sign-up validation failed: Data processing consent not given");
          toast({
            title: "Validation Error",
            description: "You must consent to data processing",
            variant: "destructive",
          });
          return;
        }

        const { error } = await signUp(email, password, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          privacyConsent,
          dataProcessingConsent,
          countryCode,
          countryIsoCode,
          phoneNumber: phoneNumber.trim() || undefined,
        });

        if (!error) {
          console.log("✅ Sign-up successful - closing modal");
          onClose();
          onSuccess?.();
        }
      } else {
        // Enhanced sign-in with immediate account existence checking
        console.log("🔐 Attempting sign-in with enhanced error handling:", { email });
        
        // First check if the email exists in our individuals table
        const { data: individual, error: checkError } = await supabase
          .from('individuals')
          .select('email, first_name, last_name')
          .eq('email', email)
          .maybeSingle();
        
        if (checkError && checkError.code !== 'PGRST116') {
          console.error("❌ Error checking account existence:", checkError);
          toast({
            title: "Connection Error",
            description: "Unable to verify account. Please try again.",
            variant: "destructive",
          });
          return;
        }

        if (!individual) {
          // Account doesn't exist - immediate feedback with sign-up prompt
          console.log("❌ Account not found for email:", email);
          
          toast({
            title: "Account Not Found",
            description: "No account exists with this email address. Please create an account to continue.",
            variant: "destructive",
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSignUp(true);
                  setEmail(email); // Pre-fill the email in sign-up form
                }}
              >
                Create Account
              </Button>
            ),
          });
          return;
        }

        // Account exists, attempt sign-in
        const { error } = await signIn(email, password);
        
        if (error) {
          console.error("❌ Sign-in failed for existing account:", error.message);
          
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Invalid Password",
              description: "The password you entered is incorrect. Please try again or reset your password.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign In Failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          console.log("✅ Sign-in successful - closing modal");
          onClose();
          onSuccess?.();
        }
      }
    } catch (error) {
      console.error("❌ Unexpected error during authentication:", error);
      toast({
        title: "Authentication Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithFacebook();
      }
      console.log(`✅ ${provider} sign-in initiated - closing modal`);
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error(`❌ ${provider} sign-in failed:`, error);
      toast({
        title: "Social Login Error",
        description: `Failed to sign in with ${provider}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleCountryChange = (newCountryCode: string, newIsoCode: string) => {
    setCountryCode(newCountryCode);
    setCountryIsoCode(newIsoCode);
    console.log("📱 Country selection changed:", { countryCode: newCountryCode, isoCode: newIsoCode });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 transition-colors z-10"
        >
          <X size={18} />
        </button>

        <div className="p-5">
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-sm text-gray-600">
              {isSignUp 
                ? "Join our community"
                : "Sign in to continue"
              }
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-2 mb-4">
            <Button
              onClick={() => handleSocialLogin('google')}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 py-2 text-sm bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:text-gray-900"
              disabled={loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>

            <Button
              onClick={() => handleSocialLogin('facebook')}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 py-2 text-sm bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:text-gray-900"
              disabled={loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="#1877F2"
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
              Facebook
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-600">or</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3 mb-4">
            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName" className="text-xs font-medium text-gray-900">First Name *</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      required
                      className="h-9 text-sm bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-500 focus:ring-gray-500"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-xs font-medium text-gray-900">Last Name *</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      required
                      className="h-9 text-sm bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-500 focus:ring-gray-500"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <PhoneInput
                    label="Phone Number"
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    countryCode={countryCode}
                    countryIsoCode={countryIsoCode}
                    onCountryChange={handleCountryChange}
                    placeholder="Enter phone number"
                    className="text-sm [&_label]:text-gray-900 [&_input]:bg-white [&_input]:border-gray-300 [&_input]:text-gray-900 [&_input]:placeholder:text-gray-500"
                    disabled={loading}
                  />
                </div>
              </>
            )}
            
            <div>
              <Label htmlFor="email" className="text-xs font-medium text-gray-900">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="h-9 text-sm bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-500 focus:ring-gray-500"
                disabled={loading}
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-xs font-medium text-gray-900">Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="h-9 text-sm bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-500 focus:ring-gray-500"
                disabled={loading}
              />
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="privacyConsent"
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                    className="mt-0.5 accent-gray-900"
                    required
                    disabled={loading}
                  />
                  <Label htmlFor="privacyConsent" className="text-xs leading-tight text-gray-900">
                    I agree to the privacy policy and terms of service *
                  </Label>
                </div>
                
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="dataProcessingConsent"
                    checked={dataProcessingConsent}
                    onChange={(e) => setDataProcessingConsent(e.target.checked)}
                    className="mt-0.5 accent-gray-900"
                    required
                    disabled={loading}
                  />
                  <Label htmlFor="dataProcessingConsent" className="text-xs leading-tight text-gray-900">
                    I consent to data processing for community engagement *
                  </Label>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full py-2 text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 focus:bg-gray-800 disabled:opacity-50" 
              disabled={loading}
            >
              {loading ? "Please wait..." : (isSignUp ? "Create Account" : "Sign In")}
            </Button>
          </form>

          {/* Toggle Sign Up/Sign In */}
          <div className="text-center">
            <p className="text-xs text-gray-600">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-gray-900 hover:text-gray-700 underline font-medium"
                disabled={loading}
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInModal;
