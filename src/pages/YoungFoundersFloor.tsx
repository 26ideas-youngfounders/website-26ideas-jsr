import { Calendar, Users, Target, Award, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const YoungFoundersFloor = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    startup: "",
    city: "",
    whyJoin: ""
  });

  const upcomingEvents = [
    {
      title: "Startup Pitch Day",
      date: "February 15, 2024",
      location: "Mumbai, In-Person",
      description: "Present your startup idea to fellow founders and get feedback"
    },
    {
      title: "Product Strategy Workshop",
      date: "February 28, 2024", 
      location: "Virtual",
      description: "Learn from successful founders about building products users love"
    },
    {
      title: "Funding Readiness Session",
      date: "March 10, 2024",
      location: "Bangalore, In-Person", 
      description: "Prepare for your next funding round with expert guidance"
    }
  ];

  const highlights = [
    "Built India's largest youth entrepreneur network",
    "Hosted 50+ successful pitch sessions",
    "Connected founders with 100+ mentors",
    "Facilitated ₹10+ crores in funding introductions"
  ];

  const testimonials = [
    {
      quote: "YoungFoundersFloor gave me the confidence and network I needed to scale my startup from idea to revenue.",
      author: "Priya Sharma",
      company: "TechFlow Solutions"
    },
    {
      quote: "The peer learning format is incredible. I learned more here than in any accelerator program.",
      author: "Arjun Patel", 
      company: "GreenStart"
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Handle form submission logic here
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 py-20 lg:py-32">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(0,0,0,0.1)_1px,_transparent_0)] bg-[length:24px_24px]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6">
            Young<span className="text-primary">Founders</span>Floor
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            India's Boldest Young Founder Community (18–27)
          </p>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Where ambitious young entrepreneurs connect, learn, and build the next generation of startups together.
          </p>
          <Button size="lg" className="text-lg px-8 py-4">
            Join the Floor <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Program Overview */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              What is YoungFoundersFloor?
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              A peer-driven community where young founders aged 18-27 come together to tackle real startup challenges, 
              share experiences, and accelerate their entrepreneurial journey through collaborative learning.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Peer-Led Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Learn from fellow founders who understand your challenges</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Real Challenges</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Work on actual startup problems with immediate solutions</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Pitch Days</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Regular opportunities to present and get feedback</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Funding Prep</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Get ready for your next funding round with expert guidance</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Upcoming Events
            </h2>
            <p className="text-lg text-muted-foreground">
              Join us at our next sessions and be part of the community
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingEvents.map((event, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                  <CardDescription className="text-primary font-medium">
                    {event.date} • {event.location}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{event.description}</p>
                  <Button className="w-full">Register Now</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Our Impact So Far
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {highlights.map((highlight, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary/10 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold text-xl">{index + 1}</span>
                </div>
                <p className="text-muted-foreground">{highlight}</p>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-muted/50">
                <CardContent className="pt-6">
                  <blockquote className="text-lg text-muted-foreground mb-4">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="font-medium text-foreground">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.company}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Who Should Join */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Who Should Join?
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We welcome ambitious young entrepreneurs who are ready to learn, share, and grow together.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-background rounded-lg border">
              <h3 className="font-semibold text-foreground mb-2">Age 18-27</h3>
              <p className="text-muted-foreground">Young entrepreneurs in their prime building years</p>
            </div>
            <div className="text-center p-6 bg-background rounded-lg border">
              <h3 className="font-semibold text-foreground mb-2">Solo Builders</h3>
              <p className="text-muted-foreground">Independent founders working on their vision</p>
            </div>
            <div className="text-center p-6 bg-background rounded-lg border">
              <h3 className="font-semibold text-foreground mb-2">Co-Founders</h3>
              <p className="text-muted-foreground">Teams building startups together</p>
            </div>
            <div className="text-center p-6 bg-background rounded-lg border">
              <h3 className="font-semibold text-foreground mb-2">College Entrepreneurs</h3>
              <p className="text-muted-foreground">Students with entrepreneurial ambitions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Join Our Community
            </h2>
            <p className="text-lg text-muted-foreground">
              Ready to connect with fellow young founders? Fill out the form below and we'll get in touch.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Full Name *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email Address *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startup" className="block text-sm font-medium text-foreground mb-2">
                      Startup Name (Optional)
                    </label>
                    <Input
                      id="startup"
                      name="startup"
                      value={formData.startup}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-foreground mb-2">
                      City *
                    </label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="whyJoin" className="block text-sm font-medium text-foreground mb-2">
                    Why do you want to join YoungFoundersFloor? *
                  </label>
                  <Textarea
                    id="whyJoin"
                    name="whyJoin"
                    value={formData.whyJoin}
                    onChange={handleInputChange}
                    rows={4}
                    required
                  />
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Submit Application
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default YoungFoundersFloor;