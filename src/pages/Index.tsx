import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-1">
        {/* Hero Section */}
        <section 
          className="relative min-h-screen flex items-center justify-start bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                The world's leading private community for{" "}
                <span className="text-blue-400">Young Founders</span>
              </h1>
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                A trusted space for Young Founders to learn, share and build their ideas to 
                impact. Access meaningful insights, programmes, build connections, 
                participate in competitions that help you take your idea to the next level.
              </p>
              <button className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black px-8 py-3 rounded-md text-lg font-medium transition-all duration-300">
                Explore
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
