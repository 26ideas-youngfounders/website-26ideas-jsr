import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const YoungFoundersFloor = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground text-center">
          Young Founders Floor Page
        </h1>
        <h2 className="text-2xl md:text-4xl font-semibold text-foreground text-center mt-8">
          Young Founders Floor Page 2
        </h2>
      </div>

      <Footer />
    </div>
  );
};

export default YoungFoundersFloor;