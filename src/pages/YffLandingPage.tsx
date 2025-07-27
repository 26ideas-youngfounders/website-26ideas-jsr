
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SignInModal } from '@/components/SignInModal';
import { Button } from '@/components/ui/button';

/**
 * Young Founders Floor Landing Page
 * Main entry point for the YFF program with hero section and registration CTA
 */
export const YffLandingPage = () => {
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showTypeformEmbed, setShowTypeformEmbed] = useState(false);
  const [hasSubmittedTypeform, setHasSubmittedTypeform] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if user has already submitted the Typeform
  useEffect(() => {
    const checkSubmissionStatus = () => {
      const submissionStatus = localStorage.getItem('typeformRegistered');
      if (submissionStatus === '1') {
        setHasSubmittedTypeform(true);
        console.log('✅ User has already submitted Typeform - hiding button');
      }
    };

    checkSubmissionStatus();
  }, []);

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

  // Handle Typeform embed toggle
  const handleTypeformToggle = () => {
    setShowTypeformEmbed(!showTypeformEmbed);
  };

  // Handle Typeform submission success
  const handleTypeformSubmit = () => {
    console.log('✅ Typeform submitted successfully - saving status and redirecting');
    
    // Store submission status in localStorage
    localStorage.setItem('typeformRegistered', '1');
    
    // Update state to hide button
    setHasSubmittedTypeform(true);
    
    // Hide the embed
    setShowTypeformEmbed(false);
    
    // Small delay to ensure storage is saved, then redirect
    setTimeout(() => {
      window.location.href = '/young-founders-floor';
    }, 100);
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
            
            {/* Only show Typeform button if user is authenticated and hasn't submitted */}
            {user && !hasSubmittedTypeform && (
              <Button
                onClick={handleTypeformToggle}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-colors duration-300"
              >
                {showTypeformEmbed ? "Hide Typeform" : "Register via Typeform"}
              </Button>
            )}
            
            {/* Show confirmation message if user has already submitted */}
            {user && hasSubmittedTypeform && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
                <p className="font-semibold">✅ You have already registered via Typeform</p>
                <p className="text-sm">Thank you for your submission!</p>
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

      {/* Typeform Embed Section */}
      {user && showTypeformEmbed && !hasSubmittedTypeform && (
        <section className="py-8 bg-white">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Register via Typeform
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <iframe
                  src="https://26ideas.typeform.com/to/FYYem6ER"
                  width="100%"
                  height="600"
                  frameBorder="0"
                  style={{ border: 'none' }}
                  title="YFF Registration Form"
                  className="rounded-lg shadow-lg"
                  onLoad={() => {
                    // Listen for Typeform submission via postMessage
                    const handleMessage = (event: MessageEvent) => {
                      if (event.origin !== 'https://26ideas.typeform.com') return;
                      
                      if (event.data.type === 'form_submit') {
                        console.log('📝 Typeform submission detected via postMessage');
                        handleTypeformSubmit();
                      }
                    };

                    window.addEventListener('message', handleMessage);
                    
                    // Cleanup listener when component unmounts
                    return () => {
                      window.removeEventListener('message', handleMessage);
                    };
                  }}
                />
              </div>
              
              {/* Manual confirmation button as fallback */}
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  If you've completed the form above, click here to confirm:
                </p>
                <Button
                  onClick={handleTypeformSubmit}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                >
                  I've completed the form
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

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
