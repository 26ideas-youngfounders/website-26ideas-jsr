
import React from 'react';

/**
 * Investment partners section matching the exact design from reference
 * Shows two key investment partners with their photos and company logos
 */
export const InvestmentPartnersSection = () => {
  const partners = [
    {
      name: "Jignesh Kenia",
      image: "/lovable-uploads/dcaec285-4185-4107-bdd9-46f3ebbfc024.png",
      logo: "/lovable-uploads/6d503697-5e4a-4472-b4a1-b3e8cce6c4e7.png"
    },
    {
      name: "Abhijeet Kumar",
      image: "/lovable-uploads/bddd61a4-a31d-487e-b9ee-c1980233f655.png",
      logo: "/lovable-uploads/87ca2695-b8b4-43c0-b2d8-a475495a7a48.png"
    }
  ];

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          Our Investment Partners
        </h2>
        
        <div className="flex justify-center items-center gap-8 md:gap-16">
          {partners.map((partner, index) => (
            <div key={index} className="text-center group">
              <div className="relative bg-gray-900 rounded-2xl overflow-hidden mb-4 w-48 h-48 mx-auto hover:shadow-xl transition-shadow duration-300">
                <img 
                  src={partner.image} 
                  alt={partner.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Company logo overlay */}
                <div className="absolute bottom-4 left-4 bg-white rounded-lg p-2 shadow-lg">
                  <img 
                    src={partner.logo} 
                    alt="Partner Company"
                    className="w-12 h-8 object-contain"
                  />
                </div>
              </div>
              
              <h3 className="font-bold text-gray-900">{partner.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
