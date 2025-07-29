
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

// Landing page components rebuilt to match reference exactly
import { HeroSection } from '@/components/landing/HeroSection';
import { MentorsCarousel } from '@/components/landing/MentorsCarousel';
import { InvestmentPartnersSection } from '@/components/landing/InvestmentPartnersSection';
import { HorizonSection } from '@/components/landing/HorizonSection';

/**
 * Homepage component - rebuilt to match reference screenshot exactly
 * Each section implemented separately for maintainability
 */
const Index = () => {
  const location = useLocation();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Handle success message display and scroll behavior
  useEffect(() => {
    if (location.state?.applicationSubmitted) {
      console.log('📋 Application submitted - showing success message and scrolling to top');
      setShowSuccessMessage(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Scroll to top on initial load
  useEffect(() => {
    if (location.state?.applicationSubmitted || !document.referrer.includes(window.location.origin)) {
      console.log('🔝 Scrolling to top of homepage');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      setTimeout(() => {
        if (window.scrollY > 100) {
          console.error('❌ Homepage scroll-to-top failed');
        } else {
          console.log('✅ Homepage scroll-to-top successful');
        }
      }, 1000);
    }
  }, [location.state, location.pathname]);

  return (
    <div className="min-h-screen bg-white">
      {showSuccessMessage && (
        <Alert className="mb-8 bg-green-50 border-green-200 max-w-2xl mx-auto">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Thank you for applying to the Young Founders Fellowship!</strong> 
            Your application has been successfully submitted. We'll review your application and get back to you soon.
          </AlertDescription>
        </Alert>
      )}

      {/* Hero Section with starry background */}
      <HeroSection />

      {/* Mentors Carousel Section */}
      <MentorsCarousel />

      {/* Investment Partners Section */}
      <InvestmentPartnersSection />

      {/* Horizon/Events Section */}
      <HorizonSection />
    </div>
  );
};

export default Index;
