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
   * Event highlights data
   */
  const highlights = [
    {
      icon: Users,
      title: "Networking Excellence",
      description: "Connect with 200+ young founders, investors, and industry leaders"
    },
    {
      icon: Calendar,
      title: "3-Day Intensive",
      description: "Packed schedule with workshops, panels, and collaboration sessions"
    },
    {
      icon: MapPin,
      title: "Premium Location",
      description: "Scenic retreat venue with all modern amenities and facilities"
    }
  ];

  /**
   * Agenda timeline data
   */
  const agenda = [
    {
      day: "Day 1",
      title: "Welcome & Foundation",
      activities: [
        "Registration & Welcome Reception",
        "Keynote: Future of Entrepreneurship",
        "Networking Dinner"
      ]
    },
    {
      day: "Day 2",
      title: "Learning & Growth",
      activities: [
        "Morning Workshops",
        "Panel Discussions",
        "Investor Pitch Sessions",
        "Evening Social Activities"
      ]
    },
    {
      day: "Day 3",
      title: "Action & Commitment",
      activities: [
        "Collaborative Projects",
        "Mentorship Matching",
        "Closing Ceremony",
        "Follow-up Planning"
      ]
    }
  ];

  /**
   * Event details
   */
  const eventDetails = {
    date: "March 15-17, 2026",
    location: "Goa, India",
    duration: "3 Days, 2 Nights",
    capacity: "200 Participants",
    price: "₹25,000 per person"
  };

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
      <section className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Young Founders Annual Retreat 2026
          </h1>
          <h3 className="text-xl md:text-2xl text-gray-200 mb-8">
            Connect. Learn. Grow. Build lasting relationships that transform your entrepreneurial journey.
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-white mb-8">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <span>{eventDetails.date}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{eventDetails.location}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              <span>{eventDetails.duration}</span>
            </div>
          </div>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-3"
          >
            Register Now - {eventDetails.price}
          </Button>
        </div>
      </section>

      {/* Event Highlights */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Join the Annual Retreat?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {highlights.map((highlight, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <highlight.icon className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{highlight.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{highlight.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Event Agenda */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            3-Day Agenda
          </h2>
          <div className="space-y-8">
            {agenda.map((day, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">{day.day}: {day.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {day.activities.map((activity, actIndex) => (
                      <li key={actIndex} className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
                        <span className="text-lg">{activity}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Event Details */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Event Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>When & Where</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <strong>Date:</strong> {eventDetails.date}
                </div>
                <div>
                  <strong>Location:</strong> {eventDetails.location}
                </div>
                <div>
                  <strong>Duration:</strong> {eventDetails.duration}
                </div>
                <div>
                  <strong>Capacity:</strong> {eventDetails.capacity}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What's Included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>• All meals and refreshments</li>
                  <li>• Premium accommodation (2 nights)</li>
                  <li>• Workshop materials and resources</li>
                  <li>• Networking events and activities</li>
                  <li>• Transportation from Mumbai</li>
                  <li>• Digital certificate of participation</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Registration Call to Action */}
      <section className="py-16 bg-primary text-primary-foreground text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Journey?</h2>
          <p className="text-xl mb-8 opacity-90">
            Limited seats available. Secure your spot at India's premier young founders retreat.
          </p>
          <div className="space-y-4">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 py-3"
            >
              Register Now - {eventDetails.price}
            </Button>
            <div className="text-sm opacity-80">
              Early bird discount available until December 31, 2025
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AnnualRetreat;