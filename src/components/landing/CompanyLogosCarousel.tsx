
import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

/**
 * Company logos carousel component matching the exact design from 26ideas.com
 * Displays partner company logos in a blue header section
 */
export const CompanyLogosCarousel = () => {
  const companies = [
    { name: "JioHotstar", logo: "✨" },
    { name: "[24]7.ai", logo: "🤖" },
    { name: "ByteDance", logo: "📊" },
    { name: "CARS24", logo: "🚗" },
  ];

  return (
    <section className="bg-blue-700 py-6 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="text-white text-left flex-shrink-0">
            <h3 className="text-lg font-medium leading-tight">
              Our mentors come from<br />
              leading companies and institutions
            </h3>
          </div>
          
          <div className="flex items-center gap-12 lg:gap-16">
            <div className="flex items-center text-white">
              <span className="text-2xl mr-2">✨</span>
              <span className="text-lg font-medium">JioHotstar</span>
            </div>
            <div className="flex items-center text-white">
              <span className="text-lg font-bold">[24]7.ai</span>
            </div>
            <div className="flex items-center text-white">
              <span className="text-lg font-bold">ByteDance</span>
            </div>
            <div className="flex items-center text-white border border-white rounded px-3 py-1">
              <span className="text-lg font-bold">CARS24</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
