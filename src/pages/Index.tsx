
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
    <div className="min-h-screen bg-white">
      {showSuccessMessage && (
        <Alert className="mb-8 bg-green-50 border-green-200 max-w-2xl mx-auto">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Thank you for applying to the Young Founders Fellowship!</strong> 
            Your application has been successfully submitted. We'll review your application and get back to you soon.
          </AlertDescription>
        </Alert>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-500 to-blue-600 py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            The world's leading<br />
            private community for<br />
            <span className="text-blue-200">Young Founders</span>
          </h1>
          
          <p className="text-xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
            A trusted space for Young Founders to learn, share and build their ideas
            to impact. Access meaningful insights, programmes, build connections,
            participate in competitions that help you take your idea to the next level.
          </p>
          
          <button className="bg-transparent border-2 border-white text-white font-semibold py-3 px-8 rounded hover:bg-white hover:text-blue-600 transition-colors duration-300">
            Explore
          </button>
        </div>
      </section>

      {/* Advisors Section */}
      <section className="bg-blue-800 py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <h3 className="text-white text-xl font-semibold mb-4 md:mb-0">
              Our advisors come from leading<br />
              companies and institutions
            </h3>
            <div className="flex items-center space-x-8 text-white">
              <span className="text-lg font-medium">Bird</span>
              <span className="text-lg font-medium">📊 ByteDance</span>
              <span className="text-lg font-medium">CARS24</span>
              <span className="text-lg font-medium">✨ JioHotstar</span>
              <span className="text-lg font-medium">PURDUE UNIVERSITY</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mentors Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Mentors at Young Founders
          </h2>
          
          <div className="flex justify-center items-center space-x-8">
            <div className="relative">
              <div className="w-64 h-64 bg-gray-900 rounded-2xl overflow-hidden">
                <img 
                  src="/lovable-uploads/dcaec285-4185-4107-bdd9-46f3ebbfc024.png" 
                  alt="Mentor" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-4 -right-4 w-12 h-8 bg-red-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">🇺🇸</span>
              </div>
            </div>
            
            <div className="relative">
              <div className="w-64 h-64 bg-gray-900 rounded-2xl overflow-hidden">
                <img 
                  src="/lovable-uploads/bddd61a4-a31d-487e-b9ee-c1980233f655.png" 
                  alt="Mentor" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-4 -right-4 w-12 h-8 bg-orange-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">🇮🇳</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* On the Horizon Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            On the Horizon for Young Founders
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
              <h3 className="text-3xl font-bold mb-4">
                Young<br />
                Founders<br />
                Floor
              </h3>
              <p className="text-blue-100 mb-6">
                India's First Entrepreneurship Competition<br />
                Where EVERYONE Wins
              </p>
              <div className="text-center">
                <h4 className="text-xl font-semibold mb-2">Young Founders Floor 2025</h4>
                <a href="/young-founders-floor" className="text-blue-200 hover:text-white">
                  Learn More →
                </a>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                2026
              </div>
              <h3 className="text-3xl font-bold mb-4 italic">
                Young Founders<br />
                Annual Retreat
              </h3>
              <div className="text-center mt-8">
                <h4 className="text-xl font-semibold mb-2">Young Founders Annual Retreat 2026</h4>
                <a href="/events/annual-retreat" className="text-gray-300 hover:text-white">
                  Learn More →
                </a>
              </div>
            </div>
          </div>
          
          {/* Journey Section */}
          <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl p-8 mb-12">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-8 text-white text-center">
              <p className="text-blue-200 mb-4">What you will learn and build?</p>
              <h3 className="text-3xl font-bold mb-2">Your journey from</h3>
              <h3 className="text-3xl font-bold text-blue-200 mb-4">Idea to impact</h3>
              <div className="w-16 h-1 bg-blue-200 mx-auto"></div>
            </div>
            <div className="text-center mt-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Young Founders Program 2025</h4>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                Learn More →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-500 to-blue-600 py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Join the world's leading private<br />
            community for Young Founders
          </h2>
          
          <p className="text-xl text-blue-100 mb-8">
            Learn, share and build their ideas to impact.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 font-semibold py-3 px-8 rounded hover:bg-blue-50 transition-colors duration-300">
              Become a Member
            </button>
            <button className="bg-transparent border-2 border-white text-white font-semibold py-3 px-8 rounded hover:bg-white hover:text-blue-600 transition-colors duration-300">
              View Pricing
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
