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
      </div>

      <Footer />
    </div>
  );
};

export default YoungFoundersFloor;