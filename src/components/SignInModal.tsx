
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { useAuth } from "@/hooks/useAuth";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SignInModal = ({ isOpen, onClose, onSuccess }: SignInModalProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91"); // Default to India
  const [countryIsoCode, setCountryIsoCode] = useState("IN"); // Default to India
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        // Validate required fields for sign-up
        if (!firstName.trim()) {
          console.error("❌ Sign-up validation failed: Missing first name");
          return;
        }
        
        if (!lastName.trim()) {
          console.error("❌ Sign-up validation failed: Missing last name");
          return;
        }
        
        if (!privacyConsent) {
          console.error("❌ Sign-up validation failed: Privacy consent not given");
          return;
        }
        
        if (!dataProcessingConsent) {
          console.error("❌ Sign-up validation failed: Data processing consent not given");
          return;
        }

        await signUp(
          email, 
          password, 
          firstName.trim(),
          lastName.trim(),
          phoneNumber.trim() || "",
          countryCode,
          countryIsoCode
        );

        console.log("✅ Sign-up successful - closing modal and showing home page");
        onClose(); // Close modal immediately
        onSuccess?.(); // Trigger any success callbacks
      } else {
        await signIn(email, password);
        console.log("✅ Sign-in successful - closing modal and showing home page");
        onClose(); // Close modal immediately
        onSuccess?.(); // Trigger any success callbacks
      }
    } catch (error) {
      console.error(`❌ ${isSignUp ? 'Sign-up' : 'Sign-in'} failed:`, error);
    } finally {
      setLoading(false);
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
      
      {/* Modal - more compact and responsive */}
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X size={18} />
        </button>

        <div className="p-5">
          {/* Content - more compact header */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-foreground mb-1">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isSignUp 
                ? "Join our community"
                : "Sign in to continue"
              }
            </p>
          </div>

          {/* Email/Password Form - more compact */}
          <form onSubmit={handleEmailSubmit} className="space-y-3 mb-4">
            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName" className="text-xs font-medium">First Name *</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      required
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-xs font-medium">Last Name *</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      required
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Phone number with country code */}
                <div>
                  <PhoneInput
                    label="Phone Number"
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    countryCode={countryCode}
                    countryIsoCode={countryIsoCode}
                    onCountryChange={handleCountryChange}
                    placeholder="Enter phone number"
                    className="text-sm"
                  />
                </div>
              </>
            )}
            
            <div>
              <Label htmlFor="email" className="text-xs font-medium">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="h-9 text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-xs font-medium">Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="h-9 text-sm"
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
                    className="mt-0.5"
                    required
                  />
                  <Label htmlFor="privacyConsent" className="text-xs leading-tight">
                    I agree to the privacy policy and terms of service *
                  </Label>
                </div>
                
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="dataProcessingConsent"
                    checked={dataProcessingConsent}
                    onChange={(e) => setDataProcessingConsent(e.target.checked)}
                    className="mt-0.5"
                    required
                  />
                  <Label htmlFor="dataProcessingConsent" className="text-xs leading-tight">
                    I consent to data processing for community engagement *
                  </Label>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full py-2 text-sm font-medium" 
              disabled={loading}
            >
              {loading ? "Please wait..." : (isSignUp ? "Create Account" : "Sign In")}
            </Button>
          </form>

          {/* Toggle Sign Up/Sign In - more compact */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary hover:underline font-medium"
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
