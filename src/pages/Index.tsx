
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

const Index = () => {
  const location = useLocation();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (location.state?.applicationSubmitted) {
      setShowSuccessMessage(true);
      
      // Clear the state and hide message after 10 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {showSuccessMessage && (
          <Alert className="mb-8 bg-green-50 border-green-200 max-w-2xl mx-auto">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Thank you for applying to the Young Founders Fellowship!</strong> 
              Your application has been successfully submitted. We'll review your application and get back to you soon.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">26ideas</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Empowering the next generation of entrepreneurs through mentorship, 
            resources, and community. Join us in building the future of innovation.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Young Founders Floor</h3>
              <p className="text-gray-600">
                An intensive fellowship program designed for ambitious young entrepreneurs 
                ready to take their ideas to the next level.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Mentorship Network</h3>
              <p className="text-gray-600">
                Connect with experienced mentors who can guide you through the challenges 
                of building a successful business.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Community Events</h3>
              <p className="text-gray-600">
                Join exclusive events, workshops, and networking opportunities with 
                like-minded entrepreneurs and industry leaders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
