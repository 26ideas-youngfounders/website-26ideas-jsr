
/**
 * @fileoverview Young Founders Floor (YFF) landing page component
 * 
 * This page serves as the main landing page for the Young Founders Floor competition,
 * India's first entrepreneurship competition where everyone wins. It includes all
 * the essential information about the program, timeline, benefits, and registration.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SignInModal from "@/components/SignInModal";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * Young Founders Floor Landing Page Component
 * 
 * Contains all sections for the YFF competition including hero, benefits,
 * timeline, rules, and registration information.
 * 
 * @returns {JSX.Element} Complete YFF landing page
 */
const YffLandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  // Show success message if redirected after submission
  useEffect(() => {
    if (location.state?.showSuccess) {
      toast({
        title: "Success!",
        description: location.state.message || "Application submitted successfully!",
        variant: "default",
      });
    }
  }, [location.state, toast]);

  /**
   * Handle registration button click
   * Check authentication status and redirect accordingly
   */
  const handleRegisterClick = () => {
    if (user) {
      // User authenticated, go to team information form
      navigate('/yff/team-information');
    } else {
      // User not authenticated, show sign in modal
      setIsSignInModalOpen(true);
    }
  };

  /**
   * Handle successful authentication from modal
   */
  const handleAuthSuccess = () => {
    setIsSignInModalOpen(false);
    toast({
      title: "Welcome!",
      description: "Please complete your team information to proceed.",
    });
    // Redirect to team information after successful auth
    setTimeout(() => {
      navigate('/yff/team-information');
    }, 1000);
  };

  /**
   * Benefits data structure for the comparison table
   * Shows what participants get in each round of the competition
   */
  const benefitsData = [
    {
      benefit: "Digital appreciation certificate",
      round1: true,
      round2: true,
      round3: true,
    },
    {
      benefit: "YFP Digital access",
      round1: true,
      round2: true,
      round3: true,
    },
    {
      benefit: "Skill Garage workshops",
      round1: true,
      round2: "2.0",
      round3: "2.0",
    },
    {
      benefit: "Cloud / SaaS credits",
      round1: false,
      round2: true,
      round3: true,
    },
    {
      benefit: "Cash reward",
      round1: false,
      round2: "₹10,000/team",
      round3: "₹10 lakh pool",
    },
    {
      benefit: "Sponsored travel (Mumbai)",
      round1: false,
      round2: false,
      round3: true,
    },
    {
      benefit: "League membership",
      round1: false,
      round2: true,
      round3: true,
    },
    {
      benefit: "VC networking",
      round1: false,
      round2: false,
      round3: true,
    },
    {
      benefit: "Internship/mentorship offers",
      round1: false,
      round2: true,
      round3: true,
    },
    {
      benefit: "Media visibility",
      round1: false,
      round2: true,
      round3: true,
    },
    {
      benefit: "Alumni mentorship",
      round1: false,
      round2: true,
      round3: true,
    },
  ];

  /**
   * Incentive categories with brief descriptions
   */
  const incentiveCategories = [
    {
      title: "Mentoring",
      description: "Get guidance from successful entrepreneurs and industry experts.",
    },
    {
      title: "Networking",
      description: "Connect with fellow founders, investors, and business leaders.",
    },
    {
      title: "Prizes",
      description: "Win cash rewards and valuable resources for your startup.",
    },
    {
      title: "Workshops",
      description: "Access exclusive skill-building sessions and masterclasses.",
    },
    {
      title: "Fundraising",
      description: "Get exposure to VCs and potential investors for your venture.",
    },
    {
      title: "Benefits",
      description: "Enjoy cloud credits, SaaS tools, and other business resources.",
    },
  ];

  /**
   * Timeline milestones for the competition
   */
  const timelineEvents = [
    { date: "15 Aug 2025", event: "Applications Open" },
    { date: "1 Nov 2025", event: "Applications Close" },
    { date: "8–9 Nov 2025", event: "Skill Garage 1.0" },
    { date: "19 Nov 2025", event: "Top 32 Announced" },
    { date: "22–23 Nov 2025", event: "Skill Garage 2.0" },
    { date: "26–29 Nov 2025", event: "Online Pitch Rounds" },
    { date: "21 Dec 2025", event: "Mumbai Grand Finale" },
  ];

  /**
   * Competition rules and guidelines
   */
  const rules = [
    "Open to all students, recent graduates, and young professionals aged 18-30",
    "Teams of 1-4 members are allowed; individual participation is also welcome",
    "One application fee of ₹5,000 per team (non-refundable)",
    "All ideas must be original and not previously funded by other accelerators",
    "Participants must be available for all scheduled events and workshops",
    "Final decisions by the judging panel are binding and non-negotiable"
  ];

  /**
   * Utility function to render table cell content based on data type
   * @param {boolean|string} value - The value to display in the cell
   * @returns {string} Formatted display value
   */
  const renderTableCell = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? "✓" : "✗";
    }
    return value;
  };

  /**
   * Feature boxes data matching the screenshot layout
   */
  const featureBoxes = [
    {
      title: "Access to 'Skill Garage'",
      subtitle: "Curated workshops by industry leading tools",
      position: "top-left"
    },
    {
      title: "Sponsored Trip to Mumbai",
      subtitle: "For the Grand Finale",
      position: "top-right"
    },
    {
      title: "Direct Access to Renowned VCs and Angel Investors",
      subtitle: "For possible funding opportunities",
      position: "bottom-left"
    },
    {
      title: "Worthy credits",
      subtitle: "From premium brands",
      position: "bottom-right"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section with Dark Geometric Background */}
      <section className="relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 overflow-hidden">
        {/* Geometric Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full">
            <svg width="100%" height="100%" viewBox="0 0 1920 1080" className="absolute inset-0">
              <defs>
                <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {/* Light Triangle Effects */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-blue-500 opacity-20 transform rotate-45 blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-blue-400 opacity-15 transform rotate-12 blur-lg"></div>

        {/* Main Content Container */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
          
          {/* Feature Boxes - Positioned around the center */}
          <div className="absolute inset-0 hidden lg:block">
            {/* Top Left */}
            <div className="absolute top-32 left-20 max-w-xs">
              <div className="bg-blue-600 rounded-2xl p-6 shadow-2xl">
                <h3 className="text-white font-bold text-lg mb-2">Access to "Skill Garage"</h3>
                <p className="text-blue-100 text-sm">Curated workshops by industry leading tools</p>
              </div>
            </div>

            {/* Top Right */}
            <div className="absolute top-32 right-20 max-w-xs">
              <div className="bg-blue-600 rounded-2xl p-6 shadow-2xl">
                <h3 className="text-white font-bold text-lg mb-2">Sponsored Trip to Mumbai</h3>
                <p className="text-blue-100 text-sm">For the Grand Finale</p>
              </div>
            </div>

            {/* Bottom Left */}
            <div className="absolute bottom-32 left-20 max-w-xs">
              <div className="bg-blue-600 rounded-2xl p-6 shadow-2xl">
                <h3 className="text-white font-bold text-lg mb-2">Direct Access to Renowned VCs and Angel Investors</h3>
                <p className="text-blue-100 text-sm">For possible funding opportunities</p>
              </div>
            </div>

            {/* Bottom Right */}
            <div className="absolute bottom-32 right-20 max-w-xs">
              <div className="bg-blue-600 rounded-2xl p-6 shadow-2xl">
                <h3 className="text-white font-bold text-lg mb-2">Worthy credits</h3>
                <p className="text-blue-100 text-sm">From premium brands</p>
              </div>
            </div>
          </div>

          {/* Central Hero Content */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 tracking-tight">
              Young Founders <span className="italic">Floor</span>
            </h1>
            
            <h2 className="text-xl md:text-2xl text-gray-300 mb-8 font-light">
              India's First Entrepreneurship Competition<br />
              Where <span className="font-bold text-white">EVERYONE</span> Wins
            </h2>

            {/* Prize Pool Display */}
            <div className="mb-12">
              <div className="inline-block relative">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-2 italic">
                  INR 10 Lakhs+ of prize pool
                </h3>
                <div className="h-1 w-full bg-white mb-4"></div>
              </div>
            </div>

            {/* Call to Action Button */}
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg px-12 py-4 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-200"
              onClick={handleRegisterClick}
            >
              {user ? "Continue Application" : "Register Now"}
            </Button>
          </div>

          {/* Mobile Feature Boxes */}
          <div className="lg:hidden mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {featureBoxes.map((box, index) => (
              <div key={index} className="bg-blue-600 rounded-2xl p-6 shadow-2xl">
                <h3 className="text-white font-bold text-lg mb-2">{box.title}</h3>
                <p className="text-blue-100 text-sm">{box.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Section - Benefits Table */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Your Unfair Advantage Starts Here
          </h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Benefit / Resource</TableHead>
                  <TableHead className="text-center">Round 1 (All)</TableHead>
                  <TableHead className="text-center">Round 2 (Top 32)</TableHead>
                  <TableHead className="text-center">Round 3 (Top 8)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {benefitsData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.benefit}</TableCell>
                    <TableCell className="text-center">
                      {renderTableCell(row.round1)}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderTableCell(row.round2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderTableCell(row.round3)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* Incentives Section */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            What You'll Gain
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {incentiveCategories.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Banner */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg md:text-xl font-semibold">
            ₹5,000 Application Fee unlocks ₹50K+ training for all, ₹1L package for Top 32,
            and ₹10L+ exposure for finalists.
          </p>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Your Journey to Success
          </h2>
          <div className="space-y-6">
            {timelineEvents.map((milestone, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-4 h-4 bg-primary rounded-full"></div>
                <div className="flex-grow border-l-2 border-muted pl-6 pb-6">
                  <div className="font-semibold text-lg">{milestone.date}</div>
                  <div className="text-muted-foreground">{milestone.event}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rules Section */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Competition Rules
          </h2>
          <ul className="space-y-4">
            {rules.map((rule, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
                <span className="text-lg">{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary text-primary-foreground text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Idea?</h2>
          <p className="text-xl mb-8">
            Join hundreds of young entrepreneurs on their journey to success.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="text-lg px-8 py-3"
            onClick={handleRegisterClick}
          >
            {user ? "Continue Application" : "Register Now"}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Sign In Modal */}
      <SignInModal 
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default YffLandingPage;
