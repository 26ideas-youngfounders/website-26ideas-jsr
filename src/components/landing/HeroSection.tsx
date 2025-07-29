
import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * Hero section component with starry background and centered content
 * Matches the exact design from the reference screenshot
 */
export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Animated starry background */}
      <div className="absolute inset-0 bg-[url('/lovable-uploads/2802b07c-20e5-4754-a277-cc00fae8b459.png')] bg-cover bg-center opacity-90"></div>
      <div className="absolute inset-0 bg-black opacity-20"></div>
      
      {/* Main content container */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          The world's leading<br />
          private community for<br />
          <span className="text-blue-300">Young Founders</span>
        </h1>
        
        <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
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
      
      {/* Bottom section with company mentions */}
      <div className="absolute bottom-8 left-0 right-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-white">
            <div className="text-center md:text-left">
              <p className="text-lg font-medium mb-2">
                Our mentors come from<br />
                leading companies and institutions
              </p>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="flex items-center">
                <span className="text-2xl font-bold mr-2">🔥</span>
                <span className="text-lg">Sprinklr</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl font-bold mr-2">🎓</span>
                <span className="text-lg">PURDUE<br />UNIVERSITY</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
