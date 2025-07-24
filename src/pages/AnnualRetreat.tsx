/**
 * @fileoverview Annual Retreat page component
 * 
 * This page provides information about the Young Founders Annual Retreat,
 * including event details, agenda, and registration information.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Home, Calendar, MapPin, Users, Clock } from "lucide-react";

/**
 * Annual Retreat Page Component
 * 
 * Displays comprehensive information about the Young Founders Annual Retreat
 * including event highlights, agenda, location details, and registration.
 * 
 * @returns {JSX.Element} Complete Annual Retreat page
 */
const AnnualRetreat = () => {
  /**
   * Feature highlights data
   */
  const features = [
    {
      icon: Users,
      title: "Keynotes from Industry Leaders",
      description: "Learn from successful entrepreneurs and industry veterans"
    },
    {
      icon: Calendar,
      title: "Hands-on Workshops & Hackathons",
      description: "Build, create and innovate with fellow founders"
    },
    {
      icon: Clock,
      title: "Investor Speed Dating",
      description: "Connect directly with investors and funding opportunities"
    },
    {
      icon: Users,
      title: "Candid Conversations",
      description: "Open discussions about real entrepreneurship challenges"
    },
    {
      icon: MapPin,
      title: "Curated Dinners & Wellness Sessions",
      description: "Network over meals and recharge with wellness activities"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />

      {/* Home Button - Fixed position in top left */}
      <div className="fixed top-20 left-4 z-50">
        <Link to="/">
          <Button 
            variant="outline" 
            size="sm"
            className="bg-white/90 hover:bg-white shadow-lg border-gray-200"
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-red-900 to-red-800 py-20 min-h-[60vh] flex items-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Young Founders Annual Retreat
          </h1>
          <h2 className="text-xl md:text-2xl text-gray-200 mb-8">
            Coming June 2026 | Location: TBD
          </h2>
          <div className="space-y-4 text-white">
            <p className="text-lg">An unforgettable weekend.</p>
            <p className="text-lg">For the most unforgettable generation.</p>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left mb-12">
            <p className="text-lg mb-4">
              We're bringing together <strong>250+ young founders</strong>, builders, investors, mentors, and enablers for a{" "}
              <strong>2-day immersive retreat</strong>—designed to fuel ambition, build deep connections, and unlock real growth.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-gray-200 bg-white">
                <CardHeader className="pb-4">
                  <div className="flex justify-center mb-4">
                    <feature.icon className="h-8 w-8 text-gray-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Dots Separator */}
      <section className="py-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center space-x-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i === 2 ? 'bg-gray-400' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            This isn't just another startup event.
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
            It's a campfire for the future young founders to know each other early—before the world knows their names.
          </p>
        </div>
      </section>

      {/* Registration Information */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-4 text-gray-700">
            <p className="text-lg">Venue, dates & details dropping soon.</p>
            <p className="text-lg font-semibold">Applications open early 2026.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AnnualRetreat;