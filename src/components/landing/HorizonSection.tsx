
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Horizon section matching the exact design from reference
 * Shows upcoming programs and events with the journey banner
 */
export const HorizonSection = () => {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          On the Horizon for Young Founders
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
          {/* Young Founders Floor */}
          <Link to="/young-founders-floor" className="group">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white h-64 hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-2">
                  Young<br />
                  Founders<br />
                  Floor
                </h3>
                <p className="text-blue-100 mb-6 text-sm">
                  India's First Entrepreneurship Competition<br />
                  Where EVERYONE Wins
                </p>
                <div className="absolute bottom-8">
                  <h4 className="text-sm font-semibold mb-1">Young Founders Floor 2025</h4>
                  <div className="text-blue-200 text-xs">Learn More →</div>
                </div>
              </div>
            </div>
          </Link>
          
          {/* Annual Retreat */}
          <Link to="/events/annual-retreat" className="group">
            <div className="bg-gray-800 rounded-2xl p-8 text-white h-64 relative overflow-hidden hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1">
              <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                2026
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-2 italic">
                  Young Founders<br />
                  Annual Retreat
                </h3>
                <div className="absolute bottom-8">
                  <h4 className="text-sm font-semibold mb-1">Young Founders Annual Retreat 2026</h4>
                  <div className="text-gray-300 text-xs">Learn More →</div>
                </div>
              </div>
            </div>
          </Link>
        </div>
        
        {/* Journey Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-12 text-white text-center relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-blue-200 mb-4 text-sm">What you will learn and build?</p>
              <h3 className="text-3xl font-bold mb-2">Your journey from</h3>
              <h3 className="text-3xl font-bold text-blue-200 mb-6">Idea to impact</h3>
            </div>
            <div className="mt-8">
              <h4 className="text-lg font-semibold mb-2">Young Founders Program 2025</h4>
              <div className="text-blue-200 text-sm">Learn More →</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
