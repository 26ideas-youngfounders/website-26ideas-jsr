
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
 * Company logos carousel component
 * Displays partner company logos in an animated horizontal carousel
 */
export const CompanyLogosCarousel = () => {
  const companies = [
    { name: "Bird", logo: "🦅" },
    { name: "ByteDance", logo: "📊" },
    { name: "CARS24", logo: "🚗" },
    { name: "JioHotstar", logo: "✨" },
    { name: "Sprinklr", logo: "💧" },
    { name: "Purdue University", logo: "🎓" },
    { name: "Microsoft", logo: "💻" },
    { name: "Google", logo: "🔍" },
  ];

  return (
    <section className="bg-blue-800 py-8 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-white text-center md:text-left">
            <h3 className="text-xl font-semibold">
              Our mentors come from<br />
              leading companies and institutions
            </h3>
          </div>
          
          <div className="flex-1 max-w-2xl">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 3000,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent>
                {companies.map((company, index) => (
                  <CarouselItem key={index} className="md:basis-1/3 lg:basis-1/4">
                    <div className="flex items-center justify-center p-4">
                      <div className="text-white text-center">
                        <div className="text-2xl mb-2">{company.logo}</div>
                        <span className="text-lg font-medium">{company.name}</span>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="text-white border-white hover:bg-white hover:text-blue-800" />
              <CarouselNext className="text-white border-white hover:bg-white hover:text-blue-800" />
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
};
