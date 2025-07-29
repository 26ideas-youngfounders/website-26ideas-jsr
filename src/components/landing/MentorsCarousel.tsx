
import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

/**
 * Mentors carousel matching 26ideas.com exactly
 * Shows mentor profiles with photos, expertise, and country flags
 */
export const MentorsCarousel = () => {
  const mentors = [
    {
      name: "Jagan Gopal Krishna",
      role: "Generative AI • Sales",
      image: "/lovable-uploads/a0f70fe3-5317-4240-b2ae-d53f5e8981e1.png",
      country: "🇸🇬",
      badges: ["AI", "ML", "SaaS"]
    },
    {
      name: "Sanjay Thakur",
      role: "BFSI",
      image: "/lovable-uploads/96f06bdf-e752-4d82-89d4-e481c36665af.png",
      country: "🇮🇳",
      badges: ["Finance", "Banking", "Strategy"]
    },
    {
      name: "Jeet Agrawal",
      role: "Engineering",
      image: "/lovable-uploads/1cafaeac-d479-4538-8927-1ec34b3ad0b4.png",
      country: "🇮🇳",
      badges: ["Tech", "Engineering", "Product"]
    },
    {
      name: "Anand Madhavan",
      role: "AI • Product",
      image: "/lovable-uploads/72856c44-6ead-48de-8838-a00fe8990bad.png",
      country: "🇺🇸",
      badges: ["AI", "Product", "Strategy"]
    },
    {
      name: "Soumya Pandey",
      role: "AI • Product",
      image: "/lovable-uploads/6a997eaf-715f-489b-8c92-f5af65f362d1.png",
      country: "🇦🇪",
      badges: ["AI", "Product", "Innovation"]
    }
  ];

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Mentors at Young Founders
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Learn from industry leaders and successful entrepreneurs who are committed to helping you succeed
          </p>
        </div>
        
        <div className="relative">
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {mentors.map((mentor, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                  <div className="relative bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group">
                    {/* Country flag */}
                    <div className="absolute -top-3 -right-3 w-14 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center z-10 border border-gray-100">
                      <span className="text-xl">{mentor.country}</span>
                    </div>
                    
                    {/* Profile image */}
                    <div className="aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                      <img 
                        src={mentor.image} 
                        alt={mentor.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    
                    {/* Profile info */}
                    <div className="p-6 text-center">
                      <h3 className="font-bold text-gray-900 mb-2 text-base leading-tight">{mentor.name}</h3>
                      <p className="text-gray-600 text-sm mb-4 font-medium">{mentor.role}</p>
                      
                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 justify-center">
                        {mentor.badges.map((badge, badgeIndex) => (
                          <span 
                            key={badgeIndex}
                            className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full font-medium border border-blue-100"
                          >
                            {badge}
                          </span>
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
