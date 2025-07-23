import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Webinars = () => {
  const webinarTopics = [
    {
      title: "Idea Validation & Zero-to-One",
      icon: "💡"
    },
    {
      title: "Building with AI from day one",
      icon: "🤖"
    },
    {
      title: "GTM & Customer Obsession",
      icon: "📈"
    },
    {
      title: "Fundraising without the Fluff",
      icon: "💰"
    },
    {
      title: "Founder Mental Models",
      icon: "🧠"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                26ideas Webinars
              </h1>
              <p className="text-xl text-blue-100 mb-6">
                Launching September 2025
              </p>
              <div className="space-y-2">
                <p className="text-lg text-white">
                  Conversations that move the needle.
                </p>
                <p className="text-lg text-white">
                  From the builders. For the builders.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Left side - Description */}
              <div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Starting this September, we're hosting a monthly webinar series—featuring founders, operators, investors, and creators from across India and beyond.
                </p>
              </div>

              {/* Right side - Webinar Topics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {webinarTopics.map((topic, index) => (
                  <div
                    key={index}
                    className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="text-2xl mb-3">{topic.icon}</div>
                    <h3 className="font-semibold text-foreground">
                      {topic.title}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Section */}
        <section className="py-16 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex justify-center mb-8">
              <div className="flex space-x-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-primary rounded-full"
                  ></div>
                ))}
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-foreground mb-4">
              No jargon. No gatekeeping.
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Just honest conversations with those who've walked the path—or are walking it with us.
            </p>
            
            <div className="space-y-2">
              <p className="text-foreground font-medium">
                First session goes live September 2025
              </p>
              <p className="text-muted-foreground">
                Schedule & speaker lineup coming soon
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Webinars;