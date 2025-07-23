import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to 26ideas</h1>
          <p className="text-xl text-muted-foreground">Young Founders Community</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
