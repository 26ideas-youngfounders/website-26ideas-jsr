import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import SignInModal from '@/components/SignInModal';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Trophy, BookOpen, MapPin, CreditCard, Plane, Network, Star } from 'lucide-react';

/**
 * Young Founders Floor landing page with authentication-based registration access
 * Features prize pool, benefits, and conditional registration button
 */
export const YffLandingPage = () => {
  const { user } = useAuth();

  // Feature boxes data matching the screenshot
  const features = [
    {
      icon: BookOpen,
      title: "Access to 'Skill Garage'",
      description: "Comprehensive skill development platform"
    },
    {
      icon: CreditCard,
      title: "Worthy credits",
      description: "Earn valuable credits for your achievements"
    },
    {
      icon: Plane,
      title: "Sponsored Trip to Mumbai",
      description: "All-expenses-paid trip to Mumbai for winners"
    },
    {
      icon: Network,
      title: "Networking Opportunities",
      description: "Connect with industry leaders and peers"
    },
    {
      icon: Users,
      title: "Mentorship Program",
      description: "Get guidance from experienced entrepreneurs"
    },
    {
      icon: Star,
      title: "Recognition & Awards",
      description: "Gain recognition for your innovative ideas"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">
      {/* Geometric Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Geometric Triangles */}
      <div className="absolute top-20 left-20 w-0 h-0 border-l-[30px] border-r-[30px] border-b-[52px] border-l-transparent border-r-transparent border-b-blue-400/20"></div>
      <div className="absolute bottom-40 right-32 w-0 h-0 border-l-[20px] border-r-[20px] border-b-[35px] border-l-transparent border-r-transparent border-b-purple-400/20"></div>
      <div className="absolute top-1/3 right-20 w-0 h-0 border-l-[25px] border-r-[25px] border-b-[43px] border-l-transparent border-r-transparent border-b-cyan-400/20"></div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-blue-400/30">
              Young Founders Floor
            </Badge>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Young Founders Floor
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Empowering the next generation of entrepreneurs with innovation, mentorship, and opportunities
          </p>
        </div>

        {/* Prize Pool Section */}
        <div className="text-center mb-16">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-2xl blur-xl"></div>
            <div className="relative bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-8 md:p-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Trophy className="h-10 w-10 text-yellow-400" />
                <span className="text-yellow-400 text-lg font-semibold">Prize Pool</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-yellow-400 mb-2">
                INR 10 Lakhs+
              </h2>
              <p className="text-gray-300 text-lg">of prize pool awaits the winners</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="bg-blue-900/20 backdrop-blur-sm border-blue-400/30 hover:bg-blue-900/30 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500/20 p-3 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                    <feature.icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-300 text-sm">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card className="bg-purple-900/20 backdrop-blur-sm border-purple-400/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-6 w-6 text-purple-400" />
                <h3 className="text-xl font-semibold text-white">Location Benefits</h3>
              </div>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  Premium venue access in Mumbai
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  Networking events with industry leaders
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  Exclusive startup ecosystem exposure
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-cyan-900/20 backdrop-blur-sm border-cyan-400/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-6 w-6 text-cyan-400" />
                <h3 className="text-xl font-semibold text-white">Community Benefits</h3>
              </div>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  Lifetime access to founder community
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  Monthly skill development workshops
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  Continuous mentorship support
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="max-w-2xl mx-auto mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Ready to Transform Your Ideas?
            </h2>
            <p className="text-gray-300 text-lg">
              Join the Young Founders Floor and take your entrepreneurial journey to the next level
            </p>
          </div>

          {/* Authentication-based Registration Button */}
          <div className="flex justify-center">
            {user ? (
              <Link to="/yff/team-registration">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Register Now
                </Button>
              </Link>
            ) : (
              <SignInModalWrapper />
            )}
          </div>

          <p className="text-gray-400 text-sm mt-4">
            {user ? 'Complete your team registration to participate' : 'You must be signed in to register for the program'}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Wrapper component for SignInModal to handle state management
 */
const SignInModalWrapper = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <>
      <Button 
        size="lg" 
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
        onClick={() => setIsModalOpen(true)}
      >
        Sign In to Register
      </Button>
      
      <SignInModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
