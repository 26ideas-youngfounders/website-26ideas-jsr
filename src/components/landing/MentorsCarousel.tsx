
import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

/**
 * Mentors carousel matching the exact design from the screenshot
 * Shows mentor profiles with photos, country flags, names, expertise, and company badges
 */
export const MentorsCarousel = () => {
  const mentors = [
    {
      name: "Soumya Pandey",
      expertise: "AI + Product",
      image: "/lovable-uploads/6a997eaf-715f-489b-8c92-f5af65f362d1.png",
      country: "🇦🇪",
      badges: ["Sprinklr", "Zeta", "Microsoft"]
    },
    {
      name: "Vinay Bhartia",
      expertise: "Sales + Marketing",
      image: "/lovable-uploads/96f06bdf-e752-4d82-89d4-e481c36665af.png",
      country: "🇮🇳",
      badges: ["PostMan", "ByteDance", "CARS24"]
    },
    {
      name: "Nitika Gupta",
      expertise: "Education",
      image: "/lovable-uploads/1cafaeac-d479-4538-8927-1ec34b3ad0b4.png",
      country: "🇮🇳",
      badges: ["UNESCO"]
    },
    {
      name: "Ramesh Gopal Krishna",
      expertise: "Partnership + Sales",
      image: "/lovable-uploads/a0f70fe3-5317-4240-b2ae-d53f5e8981e1.png",
      country: "🇸🇬",
      badges: ["Microsoft", "Meta", "Microsoft"]
    },
    {
      name: "Sanjay",
      expertise: "Engineering",
      image: "/lovable-uploads/72856c44-6ead-48de-8838-a00fe8990bad.png",
      country: "🇮🇳",
      badges: ["Meta"]
    }
  ];

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-8">
            Mentors at Young Founders
          </h2>
        </div>
        
        <div className="relative">
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {mentors.map((mentor, index) => (
                <CarouselItem key={index} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                  <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
                    {/* Country flag */}
                    <div className="absolute -top-2 -right-2 w-12 h-8 bg-white rounded-lg shadow-md flex items-center justify-center z-10 border border-gray-100">
                      <span className="text-lg">{mentor.country}</span>
                    </div>
                    
                    {/* Profile image */}
                    <div className="aspect-square overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                      <img 
                        src={mentor.image} 
                        alt={mentor.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    
                    {/* Profile info */}
                    <div className="p-6 text-center">
                      <h3 className="font-bold text-gray-900 mb-1 text-lg">{mentor.name}</h3>
                      <p className="text-gray-600 text-sm mb-4 font-medium italic">{mentor.expertise}</p>
                      
                      {/* Company badges */}
                      <div className="flex flex-wrap gap-1 justify-center">
                        {mentor.badges.map((badge, badgeIndex) => (
                          <div key={badgeIndex} className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-700">
                              {badge.charAt(0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-[-60px] border-gray-300 hover:bg-gray-100 shadow-lg" />
            <CarouselNext className="right-[-60px] border-gray-300 hover:bg-gray-100 shadow-lg" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};
