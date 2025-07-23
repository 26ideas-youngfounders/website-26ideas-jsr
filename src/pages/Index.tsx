import Navigation from "@/components/Navigation";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to 26ideas</h1>
          <p className="text-xl text-muted-foreground">Young Founders Community</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
