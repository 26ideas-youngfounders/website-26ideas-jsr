
import React, { useState, useEffect } from 'react';
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
  const [typeformScriptLoaded, setTypeformScriptLoaded] = useState(false);
  const [typeformReady, setTypeformReady] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load Typeform embed script
  useEffect(() => {
    const loadTypeformScript = () => {
      // Check if script already exists
      if (document.querySelector('script[src*="embed.typeform.com"]')) {
        console.log("✅ Typeform script already loaded");
        setTypeformScriptLoaded(true);
        // Add a small delay to ensure the script is fully initialized
        setTimeout(() => {
          setTypeformReady(true);
        }, 1000);
        return;
      }

      console.log("🔄 Loading Typeform embed script");
      const script = document.createElement('script');
      script.src = '//embed.typeform.com/next/embed.js';
      script.async = true;
      script.onload = () => {
        console.log("✅ Typeform script loaded successfully");
        setTypeformScriptLoaded(true);
        // Add a small delay to ensure the script is fully initialized
        setTimeout(() => {
          setTypeformReady(true);
        }, 1000);
      };
      script.onerror = () => {
        console.error("❌ Failed to load Typeform script");
        toast({
          title: "Error",
          description: "Failed to load Typeform. Please try refreshing the page.",
          variant: "destructive",
        });
      };
      document.head.appendChild(script);
    };

    loadTypeformScript();

    // Cleanup function
    return () => {
      const script = document.querySelector('script[src*="embed.typeform.com"]');
      if (script) {
        script.remove();
      }
    };
  }, [toast]);

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

  // Manual Typeform handler using native API
  const handleNativeTypeformOpen = () => {
    console.log("🔄 Opening Typeform using native API");
    
    if (!typeformReady) {
      toast({
        title: "Please wait",
        description: "Typeform is still loading. Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    // Use native window.tf API
    if (typeof window !== 'undefined' && window.tf) {
      try {
        const popup = window.tf.createPopup("01K16KGT1RZ1HHF3X527EMMVXS", {
          onSubmit: handleTypeformSubmit,
          onReady: handleTypeformReady,
          onClose: handleTypeformClose,
        });
        popup.open();
        console.log("✅ Typeform opened using native API");
      } catch (error) {
        console.error("❌ Error opening Typeform:", error);
        toast({
          title: "Error",
          description: "Unable to open registration form. Please try the direct registration.",
          variant: "destructive",
        });
      }
    } else {
      console.error("❌ Typeform API not available");
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
            
            {user && typeformReady && (
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <Button
                  onClick={handleNativeTypeformOpen}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-colors duration-300"
                >
                  Register via Typeform
                </Button>
              </div>
            )}
            
            {user && typeformScriptLoaded && !typeformReady && (
              <div className="text-sm text-gray-600">
                Initializing Typeform...
              </div>
            )}
            
            {user && !typeformScriptLoaded && (
              <div className="text-sm text-gray-600">
                Loading Typeform...
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
