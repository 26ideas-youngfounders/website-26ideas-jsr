
import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

/**
 * Mentors carousel component
 * Displays mentor profiles in a responsive carousel with country flags and expertise badges
 */
export const MentorsCarousel = () => {
  const mentors = [
    {
      name: "Jagan Gopal Krishna",
      role: "Generative AI • Sales",
      image: "/lovable-uploads/dcaec285-4185-4107-bdd9-46f3ebbfc024.png",
      country: "🇸🇬",
      badges: ["AI", "ML", "SaaS"]
    },
    {
      name: "Sanjay Thakur",
      role: "BFSI",
      image: "/lovable-uploads/bddd61a4-a31d-487e-b9ee-c1980233f655.png",
      country: "🇮🇳",
      badges: ["Finance", "Banking", "Strategy"]
    },
    {
      name: "Jeet Agrawal",
      role: "Engineering",
      image: "/lovable-uploads/dcaec285-4185-4107-bdd9-46f3ebbfc024.png",
      country: "🇮🇳",
      badges: ["Tech", "Engineering", "Product"]
    },
    {
      name: "Anand Madhavan",
      role: "AI • Product",
      image: "/lovable-uploads/bddd61a4-a31d-487e-b9ee-c1980233f655.png",
      country: "🇺🇸",
      badges: ["AI", "Product", "Strategy"]
    },
    {
      name: "Soumya Pandey",
      role: "AI • Product",
      image: "/lovable-uploads/dcaec285-4185-4107-bdd9-46f3ebbfc024.png",
      country: "🇦🇪",
      badges: ["AI", "Product", "Innovation"]
    }
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          Mentors at Young Founders
        </h2>
        
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent>
            {mentors.map((mentor, index) => (
              <CarouselItem key={index} className="md:basis-1/3 lg:basis-1/5">
                <div className="p-4">
                  <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    {/* Country flag */}
                    <div className="absolute -top-2 -right-2 w-12 h-8 bg-white rounded-lg shadow-md flex items-center justify-center z-10">
                      <span className="text-lg">{mentor.country}</span>
                    </div>
                    
                    {/* Profile image */}
                    <div className="aspect-square overflow-hidden">
                      <img 
                        src={mentor.image} 
                        alt={mentor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Profile info */}
                    <div className="p-4 text-center">
                      <h3 className="font-bold text-gray-900 mb-1 text-sm">{mentor.name}</h3>
                      <p className="text-gray-600 text-xs mb-3">{mentor.role}</p>
                      
                      {/* Badges */}
                      <div className="flex flex-wrap gap-1 justify-center">
                        {mentor.badges.map((badge, badgeIndex) => (
                          <span 
                            key={badgeIndex}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-[-60px]" />
          <CarouselNext className="right-[-60px]" />
        </Carousel>
      </div>
    </section>
  );
};
