/**
 * @fileoverview Home page component for the 26ideas Young Founders platform.
 * 
 * This component renders the main landing page with a hero section showcasing
 * the platform's value proposition for young entrepreneurs. It includes the
 * navigation header, main content area, and footer.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

// React and UI Components
import React from "react";
import Autoplay from "embla-carousel-autoplay";

// Internal Components
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";


/**
 * Index Page Component
 * 
 * The main landing page for the 26ideas Young Founders platform.
 * Features a full-screen hero section with compelling messaging to attract
 * young entrepreneurs to join the community.
 * 
 * Layout Structure:
 * - Navigation header with community links and sign-in
 * - Hero section with main value proposition
 * - Advisors section with scrolling company logos
 * - Mentors section with auto-scrolling mentor cards
 * - Footer with community links and social media
 * 
 * @returns {JSX.Element} The complete home page layout
 */
const Index = () => {
  // Initialize autoplay plugin for the mentor carousel
  const autoplayPlugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  /**
   * Mentor data array containing profile information and image paths
   * Each mentor object includes their name, specialization, and image path
   */
  const mentors = [
    {
      id: 1,
      name: "Anand Madhavan",
      specialty: "AI + Product",
      image: "/lovable-uploads/ef884e0a-d2b0-4142-bf8c-f2fc9dd6f818.png",
      alt: "Anand Madhavan - AI and Product Expert"
    },
    {
      id: 2,
      name: "Jeet Agrawal",
      specialty: "Engineering",
      image: "/lovable-uploads/d5213e8c-32d8-4299-bf86-2890ffc5dfe2.png",
      alt: "Jeet Agrawal - Engineering Expert"
    },
    {
      id: 3,
      name: "Nitika Gupta",
      specialty: "Education",
      image: "/lovable-uploads/96f06bdf-e752-4d82-89d4-e481c36665af.png",
      alt: "Nitika Gupta - Education Expert"
    },
    {
      id: 4,
      name: "Ramesh Gopal Krishna",
      specialty: "Partnership + Sales",
      image: "/lovable-uploads/671c88aa-4985-41da-9941-a9b265e13cc4.png",
      alt: "Ramesh Gopal Krishna - Partnership and Sales Expert"
    },
    {
      id: 5,
      name: "Sanjay Thakur",
      specialty: "BFSI",
      image: "/lovable-uploads/1cafaeac-d479-4538-8927-1ec34b3ad0b4.png",
      alt: "Sanjay Thakur - BFSI Expert"
    },
    {
      id: 6,
      name: "Soumya Pandey",
      specialty: "AI + Product",
      image: "/lovable-uploads/c5833fd2-af8d-4cd5-9647-7da7a6982aaa.png",
      alt: "Soumya Pandey - AI and Product Expert"
    },
    {
      id: 7,
      name: "Vinay Bhartia",
      specialty: "Sales + Marketing",
      image: "/lovable-uploads/87fb696a-f01d-4561-82f9-3c6599212a99.png",
      alt: "Vinay Bhartia - Sales and Marketing Expert"
    }
  ];
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main navigation header */}
      <Navigation />
      
      {/* Main content area - uses flex-1 to fill available space */}
      <main className="flex-1">
        {/* Hero Section - Full screen section with gradient background */}
        <section 
          className="relative min-h-screen flex items-center justify-start bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400"
        >
          {/* Content container with responsive padding */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Text content limited to 2/3 width for better readability */}
            <div className="max-w-2xl">
              {/* Main headline with responsive font sizing */}
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                The world's leading private community for{" "}
                {/* Highlighted brand term with accent color */}
                <span className="text-blue-400">Young Founders</span>
              </h1>
              
              {/* Supporting description with clear value proposition */}
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                A trusted space for Young Founders to learn, share and build their ideas to 
                impact. Access meaningful insights, programmes, build connections, 
                participate in competitions that help you take your idea to the next level.
              </p>
              
              {/* Primary call-to-action button with hover effects */}
              <button className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black px-8 py-3 rounded-md text-lg font-medium transition-all duration-300">
                Explore
              </button>
            </div>
          </div>
        </section>

        {/* Advisors Section - Full width with scrolling logos */}
        <section className="bg-blue-900 py-12 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left side - Heading (Fixed width column) */}
              <div className="lg:col-span-4 text-center lg:text-left">
                <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
                  Our advisors come from leading companies and institutions
                </h3>
              </div>
              
              {/* Right side - Scrolling logos ticker (Fixed width column) */}
              <div className="lg:col-span-8 relative overflow-hidden">
                <div className="flex animate-scroll">
                  {/* First set of logos */}
                  <div className="flex items-center space-x-8 min-w-max">
                    <img 
                      src="/lovable-uploads/8010c706-d62b-4635-a835-1b23bddf638c.png" 
                      alt="Advisor Company Logo" 
                      className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                    <img 
                      src="/lovable-uploads/87ca2695-b8b4-43c0-b2d8-a475495a7a48.png" 
                      alt="Advisor Company Logo" 
                      className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                    <img 
                      src="/lovable-uploads/6359af06-63e6-413f-ab8a-5839203f9c19.png" 
                      alt="Advisor Company Logo" 
                      className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                    <img 
                      src="/lovable-uploads/31bb3cde-986b-43a6-a184-6b8a8d0743d0.png" 
                      alt="Advisor Company Logo" 
                      className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                    <img 
                      src="/lovable-uploads/fbb352ad-a307-4649-abe8-ce778193ecc5.png" 
                      alt="Advisor Company Logo" 
                      className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                    <img 
                      src="/lovable-uploads/92147d9d-87b9-44ba-8a73-dd8cbd226d41.png" 
                      alt="Advisor Company Logo" 
                      className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                    <img 
                      src="/lovable-uploads/6a997eaf-715f-489b-8c92-f5af65f362d1.png" 
                      alt="Advisor Company Logo" 
                      className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                    <img 
                      src="/lovable-uploads/a0f70fe3-5317-4240-b2ae-d53f5e8981e1.png" 
                      alt="Advisor Company Logo" 
                      className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                    <img 
                      src="/lovable-uploads/b57b618a-00e6-44e0-b836-f699bbe3ca7b.png" 
                      alt="Advisor Company Logo" 
                      className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                  </div>
                  
                  {/* Duplicate set for seamless scrolling */}
                  <div className="flex items-center space-x-8 min-w-max ml-8">
                    <img 
                      src="/lovable-uploads/8010c706-d62b-4635-a835-1b23bddf638c.png" 
                      alt="Advisor Company Logo" 
                      className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                    <img 
                      src="/lovable-uploads/87ca2695-b8b4-43c0-b2d8-a475495a7a48.png" 
                      alt="Advisor Company Logo" 
                      className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                    <img 
                      src="/lovable-uploads/6359af06-63e6-413f-ab8a-5839203f9c19.png" 
                      alt="Advisor Company Logo" 
                      className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                    <img 
                      src="/lovable-uploads/31bb3cde-986b-43a6-a184-6b8a8d0743d0.png" 
                      alt="Advisor Company Logo" 
                      className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                    <img 
                      src="/lovable-uploads/fbb352ad-a307-4649-abe8-ce778193ecc5.png" 
                      alt="Advisor Company Logo" 
                      className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                    <img 
                      src="/lovable-uploads/92147d9d-87b9-44ba-8a73-dd8cbd226d41.png" 
                      alt="Advisor Company Logo" 
                      className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                    <img 
                      src="/lovable-uploads/6a997eaf-715f-489b-8c92-f5af65f362d1.png" 
                      alt="Advisor Company Logo" 
                      className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                    <img 
                      src="/lovable-uploads/a0f70fe3-5317-4240-b2ae-d53f5e8981e1.png" 
                      alt="Advisor Company Logo" 
                      className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                    <img 
                      src="/lovable-uploads/b57b618a-00e6-44e0-b836-f699bbe3ca7b.png" 
                      alt="Advisor Company Logo" 
                      className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mentors Section - Auto-scrolling carousel of mentor cards */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section heading - centered and prominent with consistent 60px spacing */}
            <div className="text-center mb-15">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Mentors at Young Founders
              </h2>
            </div>

            {/* Mentor carousel with auto-scroll functionality and responsive sizing */}
            <div className="relative w-full overflow-hidden">
              <Carousel
                plugins={[autoplayPlugin.current]}
                className="w-full"
                onMouseEnter={autoplayPlugin.current.stop}
                onMouseLeave={autoplayPlugin.current.reset}
                opts={{
                  align: "start",
                  loop: true,
                  containScroll: "trimSnaps",
                }}
              >
                <CarouselContent className="-ml-1 sm:-ml-2 md:-ml-4">
                  {mentors.map((mentor) => (
                    <CarouselItem 
                      key={mentor.id} 
                      className="pl-1 sm:pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/4 min-w-0"
                    >
                      {/* Individual mentor card with proper aspect ratio and responsive sizing */}
                      <div className="group cursor-pointer transform transition-all duration-300 hover:scale-105 w-full">
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300 w-full">
                          {/* Mentor profile image with proper aspect ratio */}
                          <div className="aspect-square overflow-hidden w-full">
                            <img
                              src={mentor.image}
                              alt={mentor.alt}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              loading="lazy"
                            />
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                
                {/* Navigation arrows positioned responsively */}
                <CarouselPrevious className="absolute -left-4 sm:-left-8 md:-left-12 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border border-gray-200 text-gray-600 hover:text-gray-900 shadow-lg" />
                <CarouselNext className="absolute -right-4 sm:-right-8 md:-right-12 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border border-gray-200 text-gray-600 hover:text-gray-900 shadow-lg" />
              </Carousel>
            </div>
          </div>
        </section>
      </main>
      
      {/* Site footer with links and social media */}
      <Footer />
    </div>
  );
};

export default Index;
