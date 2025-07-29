
import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * Call to action section component
 * Final section encouraging membership with dual CTA buttons
 */
export const CtaSection = () => {
  return (
    <section className="bg-gradient-to-r from-blue-500 to-blue-600 py-16 px-4">
      <div className="container mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          Join the world's leading private<br />
          community for Young Founders
        </h2>
        
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Learn, share and build their ideas to impact.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold py-4 px-8 text-lg transition-all duration-300 transform hover:scale-105"
          >
            Become a Member
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-blue-600 font-semibold py-4 px-8 text-lg transition-all duration-300 transform hover:scale-105"
          >
            View Pricing
          </Button>
        </div>
      </div>
    </section>
  );
};
