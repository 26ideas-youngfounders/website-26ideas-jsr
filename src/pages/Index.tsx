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

// Internal Components
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";


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
 * - Footer with community links and social media
 * 
 * @returns {JSX.Element} The complete home page layout
 */
const Index = () => {
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
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Left side - Heading */}
              <div className="lg:w-1/3 text-center lg:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                  Our advisors come from leading companies and institutions
                </h2>
              </div>
              
              {/* Right side - Scrolling logos ticker */}
              <div className="lg:w-2/3 relative">
                <div className="flex animate-scroll">
                  {/* First set of logos */}
                  <div className="flex items-center space-x-12 min-w-max">
                    <img 
                      src="/lovable-uploads/6d503697-5e4a-4472-b4a1-b3e8cce6c4e7.png" 
                      alt="Advisor Companies Logos" 
                      className="h-12 object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                  </div>
                  
                  {/* Duplicate set for seamless scrolling */}
                  <div className="flex items-center space-x-12 min-w-max ml-12">
                    <img 
                      src="/lovable-uploads/6d503697-5e4a-4472-b4a1-b3e8cce6c4e7.png" 
                      alt="Advisor Companies Logos" 
                      className="h-12 object-contain opacity-80 hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              </div>
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
