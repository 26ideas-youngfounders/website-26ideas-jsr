
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/**
 * Horizon section matching 26ideas.com design
 * Shows upcoming programs and events with journey CTA
 */
export const HorizonSection = () => {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            On the Horizon for Young Founders
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upcoming programs, events, and opportunities designed to accelerate your entrepreneurial journey
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-5xl mx-auto">
          {/* Young Founders Floor */}
          <Link to="/young-founders-floor" className="group">
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-3xl p-8 text-white h-80 hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-3xl font-bold mb-4 leading-tight">
                    Young<br />
                    Founders<br />
                    Floor
                  </h3>
                  <p className="text-blue-100 mb-6 text-base leading-relaxed">
                    India's First Entrepreneurship Competition<br />
                    Where EVERYONE Wins
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-2">Young Founders Floor 2025</h4>
                  <div className="text-blue-200 text-sm font-medium group-hover:text-white transition-colors">
                    Learn More →
                  </div>
                </div>
              </div>
            </div>
          </Link>
          
          {/* Annual Retreat */}
          <Link to="/events/annual-retreat" className="group">
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-3xl p-8 text-white h-80 relative overflow-hidden hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-2">
              <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                2026
              </div>
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-3xl font-bold mb-4 leading-tight italic">
                    Young Founders<br />
                    Annual Retreat
                  </h3>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-2">Young Founders Annual Retreat 2026</h4>
                  <div className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors">
                    Learn More →
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
        
        {/* Journey CTA Banner */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-3xl p-12 lg:p-16 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzMzMzNGRiIgZmlsbC1vcGFjaXR5PSIwLjIiLz4KPC9zdmc+')] opacity-50"></div>
            
            <div className="relative z-10">
              <p className="text-blue-200 mb-4 text-lg font-medium">What you will learn and build?</p>
              <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 leading-tight">Your journey from</h3>
              <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold text-blue-200 mb-8 leading-tight">idea to impact</h3>
              
              <div className="mt-12">
                <Button
                  size="lg"
                  className="bg-white text-blue-700 hover:bg-blue-50 font-semibold py-4 px-10 text-lg rounded-full shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Start Your Journey
                </Button>
                <div className="mt-4">
                  <p className="text-blue-200 text-sm font-medium">Young Founders Program 2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
