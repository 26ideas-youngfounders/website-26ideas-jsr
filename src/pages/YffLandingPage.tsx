
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SignInModal } from '@/components/SignInModal';
import { PopupButton } from '@typeform/embed-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Extend Window interface to include Typeform
declare global {
  interface Window {
    tf?: {
      createPopup: (formId: string, options?: {
        onSubmit?: () => void;
        onReady?: () => void;
        onClose?: () => void;
      }) => {
        open: () => void;
      };
    };
  }
}

/**
 * Young Founders Floor Landing Page
 * Main entry point for the YFF program with hero section and registration CTA
 */
export const YffLandingPage = () => {
  const [showSignInModal, setShowSignInModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle sign-in success - redirect directly to registration
  const handleSignInSuccess = () => {
    console.log("✅ Sign-in successful - redirecting to team registration");
    setShowSignInModal(false);
    navigate('/yff/team-registration');
  };

  // Handle register button click
  const handleRegisterClick = () => {
    if (user) {
      console.log("✅ User authenticated - navigating to registration");
      navigate('/yff/team-registration');
    } else {
      console.log("🔐 User not authenticated - showing sign-in modal");
      setShowSignInModal(true);
    }
  };

  // Handle Typeform submission
  const handleTypeformSubmit = () => {
    console.log("✅ Typeform submission completed");
    toast({
      title: "Registration Submitted!",
      description: "Thank you for registering via Typeform. We'll be in touch soon.",
    });
  };

  // Handle Typeform ready event
  const handleTypeformReady = () => {
    console.log("✅ Typeform is ready");
  };

  // Handle Typeform close event
  const handleTypeformClose = () => {
    console.log("ℹ️ Typeform popup closed");
  };

  // Fallback handler for manual Typeform opening (if PopupButton fails)
  const handleManualTypeformOpen = () => {
    console.log("🔄 Attempting to open Typeform manually");
    
    // Check if window.tf is available
    if (typeof window !== 'undefined' && window.tf) {
      try {
        window.tf.createPopup("01K16KGT1RZ1HHF3X527EMMVXS", {
          onSubmit: handleTypeformSubmit,
          onReady: handleTypeformReady,
          onClose: handleTypeformClose,
        }).open();
      } catch (error) {
        console.error("❌ Error opening Typeform manually:", error);
        toast({
          title: "Error",
          description: "Unable to open registration form. Please try again or use the direct registration.",
          variant: "destructive",
        });
      }
    } else {
      console.error("❌ Typeform embed script not loaded");
      toast({
        title: "Error",
        description: "Registration form is not available. Please try the direct registration instead.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Young Founders Floor
          </h1>
          <p className="text-xl text-gray-700 mb-12">
            Empowering the next generation of entrepreneurs
          </p>
          
          {/* Registration Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleRegisterClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-colors duration-300"
            >
              {user ? "Register Now" : "Sign in to register"}
            </button>
            
            {user && (
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <PopupButton
                  id="01K16KGT1RZ1HHF3X527EMMVXS"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-colors duration-300"
                  onSubmit={handleTypeformSubmit}
                  onReady={handleTypeformReady}
                  onClose={handleTypeformClose}
                  enableSandbox={false}
                  autoClose={5000}
                >
                  Register via Typeform
                </PopupButton>
                
                {/* Fallback button for debugging */}
                <Button
                  onClick={handleManualTypeformOpen}
                  variant="outline"
                  className="text-xs px-3 py-1 h-auto"
                >
                  Debug: Manual Open
                </Button>
              </div>
            )}
          </div>
          
          {!user && (
            <p className="text-sm text-gray-600 mt-4">
              Sign in to access Typeform registration
            </p>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Mentorship
              </h3>
              <p className="text-gray-700">
                Get guidance from industry experts and seasoned entrepreneurs.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Networking
              </h3>
              <p className="text-gray-700">
                Connect with like-minded individuals and potential investors.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Resources
              </h3>
              <p className="text-gray-700">
                Access exclusive tools and resources to help you build your startup.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Sign-in Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSignInSuccess={handleSignInSuccess}
      />
    </div>
  );
};
