
import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * Hero section component matching 26ideas.com design exactly
 * Features starry background, centered content, and company logos at bottom
 */
export const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Starry background overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJzdGFycyIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8Y2lyY2xlIGN4PSIzIiBjeT0iMyIgcj0iMSIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iMC4zIi8+CiAgICAgIDxjaXJjbGUgY3g9IjEzIiBjeT0iMTMiIHI9IjEiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuNCIvPgogICAgICA8Y2lyY2xlIGN4PSI3MyIgY3k9IjczIiByPSIxIiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjIiLz4KICAgICAgPGNpcmNsZSBjeD0iMTMzIiBjeT0iMTMzIiByPSIxIiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjM1Ii8+CiAgICA8L3BhdHRlcm4+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI3N0YXJzKSIvPgo8L3N2Zz4=')] opacity-60"></div>
      </div>
      
      {/* Main hero content */}
      <div className="relative z-10 flex flex-col justify-center items-center min-h-screen px-4 text-center">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-8 leading-tight">
            The world's leading<br />
            private community for<br />
            <span className="text-blue-300">Young Founders</span>
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
            A trusted space for Young Founders to learn, share and build their ideas 
            to impact. Access meaningful insights, programmes, build connections, 
            participate in competitions that help you take your idea to the next level.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Button 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-10 text-lg rounded-full shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Become a Member
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-blue-900 font-semibold py-4 px-10 text-lg rounded-full shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Explore Programs
            </Button>
          </div>
        </div>
      </div>
      
      {/* Bottom company logos section */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-blue-900/80 backdrop-blur-sm py-8 border-t border-blue-700/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-white text-center lg:text-left">
              <p className="text-lg md:text-xl font-medium leading-tight">
                Our mentors come from<br />
                leading companies and institutions
              </p>
            </div>
            
            <div className="flex items-center gap-12">
              <div className="flex items-center">
                <img 
                  src="/lovable-uploads/87ca2695-b8b4-43c0-b2d8-a475495a7a48.png" 
                  alt="Partner Company" 
                  className="h-10 md:h-12 filter brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="flex items-center">
                <img 
                  src="/lovable-uploads/6d503697-5e4a-4472-b4a1-b3e8cce6c4e7.png" 
                  alt="Partner Company" 
                  className="h-10 md:h-12 filter brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
