
import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * Final CTA section matching 26ideas.com design
 * Encourages membership with compelling copy and dual CTAs
 */
export const CtaSection = () => {
  return (
    <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMS41IiBmaWxsPSIjRkZGRkZGIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')] opacity-40"></div>
      
      <div className="container mx-auto text-center relative z-10 max-w-5xl">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight">
          Join the world's leading private<br />
          community for Young Founders
        </h2>
        
        <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
          Connect with like-minded entrepreneurs, access exclusive resources, 
          and accelerate your journey from idea to impact
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Button 
            size="lg"
            className="bg-white text-blue-700 hover:bg-blue-50 font-semibold py-4 px-10 text-lg rounded-full shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Become a Member
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-blue-700 font-semibold py-4 px-10 text-lg rounded-full shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            View Pricing
          </Button>
        </div>
        
        <div className="mt-12 text-blue-200 text-base">
          <p>🚀 Join 10,000+ young entrepreneurs already building the future</p>
        </div>
      </div>
    </section>
  );
};
