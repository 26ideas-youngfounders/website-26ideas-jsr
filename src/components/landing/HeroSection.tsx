
import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * Hero section component matching the exact design from reference
 * Dark starry background with centered content and bottom company logos
 */
export const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 overflow-hidden">
      {/* Starry background */}
      <div className="absolute inset-0 bg-black opacity-20"></div>
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col justify-center items-center min-h-screen px-4 text-center">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            The world's leading<br />
            private community for<br />
            <span className="text-blue-300">Young Founders</span>
          </h1>
          
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            A trusted space for Young Founders to learn, share and build their ideas 
            to impact. Access meaningful insights, programmes, build connections, 
            participate in competitions that help you take your idea to the next level.
          </p>
          
          <Button 
            variant="outline" 
            size="lg"
            className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-blue-900 transition-all duration-300 px-8 py-3 text-lg font-semibold"
          >
            Explore
          </Button>
        </div>
      </div>
      
      {/* Bottom section with company logos */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-blue-800 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="text-white text-left">
              <p className="text-base font-medium">
                Our mentors come from<br />
                leading companies and institutions
              </p>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="flex items-center">
                <img 
                  src="/lovable-uploads/87ca2695-b8b4-43c0-b2d8-a475495a7a48.png" 
                  alt="Company Logo" 
                  className="h-8 filter brightness-0 invert"
                />
              </div>
              <div className="flex items-center">
                <img 
                  src="/lovable-uploads/6d503697-5e4a-4472-b4a1-b3e8cce6c4e7.png" 
                  alt="Company Logo" 
                  className="h-8 filter brightness-0 invert"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
