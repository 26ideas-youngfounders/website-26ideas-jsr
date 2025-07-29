
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/**
 * Horizon section component
 * Displays upcoming programs and events with interactive cards
 */
export const HorizonSection = () => {
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          On the Horizon for Young Founders
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Young Founders Floor */}
          <Link to="/young-founders-floor" className="group">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white h-full hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1">
              <h3 className="text-3xl font-bold mb-4 leading-tight">
                Young<br />
                Founders<br />
                Floor
              </h3>
              <p className="text-blue-100 mb-6 text-lg">
                India's First Entrepreneurship Competition<br />
                Where EVERYONE Wins
              </p>
              <div className="mt-8">
                <h4 className="text-xl font-semibold mb-2">Young Founders Floor 2025</h4>
                <div className="text-blue-200 group-hover:text-white transition-colors duration-200 font-medium">
                  Learn More →
                </div>
              </div>
            </div>
          </Link>
          
          {/* Annual Retreat */}
          <Link to="/events/annual-retreat" className="group">
            <div className="bg-gray-800 rounded-2xl p-8 text-white h-full relative overflow-hidden hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1">
              <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                2026
              </div>
              <h3 className="text-3xl font-bold mb-4 italic leading-tight">
                Young Founders<br />
                Annual Retreat
              </h3>
              <div className="mt-12">
                <h4 className="text-xl font-semibold mb-2">Young Founders Annual Retreat 2026</h4>
                <div className="text-gray-300 group-hover:text-white transition-colors duration-200 font-medium">
                  Learn More →
                </div>
              </div>
            </div>
          </Link>
        </div>
        
        {/* Journey Section */}
        <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl p-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-8 text-white text-center mb-6">
            <p className="text-blue-200 mb-4 text-lg">What you will learn and build?</p>
            <h3 className="text-3xl font-bold mb-2">Your journey from</h3>
            <h3 className="text-3xl font-bold text-blue-200 mb-4">Idea to impact</h3>
            <div className="w-16 h-1 bg-blue-200 mx-auto"></div>
          </div>
          <div className="text-center">
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Young Founders Program 2025</h4>
            <Button variant="link" className="text-gray-600 hover:text-gray-900 p-0">
              Learn More →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
