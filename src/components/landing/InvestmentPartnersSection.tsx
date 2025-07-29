
import React from 'react';

/**
 * Investment partners section matching 26ideas.com design
 * Shows key investment partners with professional photos and logos
 */
export const InvestmentPartnersSection = () => {
  const partners = [
    {
      name: "Jignesh Kenia",
      image: "/lovable-uploads/c5833fd2-af8d-4cd5-9647-7da7a6982aaa.png",
      logo: "/lovable-uploads/87ca2695-b8b4-43c0-b2d8-a475495a7a48.png"
    },
    {
      name: "Abhijeet Kumar", 
      image: "/lovable-uploads/2802b07c-20e5-4754-a277-cc00fae8b459.png",
      logo: "/lovable-uploads/6d503697-5e4a-4472-b4a1-b3e8cce6c4e7.png"
    }
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Investment Partners
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Backed by leading investors who believe in empowering the next generation of entrepreneurs
          </p>
        </div>
        
        <div className="flex justify-center items-center gap-12 md:gap-20">
          {partners.map((partner, index) => (
            <div key={index} className="text-center group">
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden mb-6 w-56 h-56 mx-auto hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <img 
                  src={partner.image} 
                  alt={partner.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                
                {/* Company logo overlay */}
                <div className="absolute bottom-4 left-4 bg-white rounded-xl p-3 shadow-lg border border-gray-100">
                  <img 
                    src={partner.logo} 
                    alt="Partner Company"
                    className="w-14 h-10 object-contain"
                  />
                </div>
              </div>
              
              <h3 className="font-bold text-gray-900 text-lg">{partner.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
