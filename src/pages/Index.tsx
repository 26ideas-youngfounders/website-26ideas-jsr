
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

// New landing page components
import { HeroSection } from '@/components/landing/HeroSection';
import { CompanyLogosCarousel } from '@/components/landing/CompanyLogosCarousel';
import { MentorsCarousel } from '@/components/landing/MentorsCarousel';
import { InvestmentPartnersSection } from '@/components/landing/InvestmentPartnersSection';
import { HorizonSection } from '@/components/landing/HorizonSection';
import { CtaSection } from '@/components/landing/CtaSection';

/**
 * Homepage component that displays the main landing page
 * Handles success messages and scroll position after form submissions
 * Features comprehensive sections with carousels and interactive elements
 */
const Index = () => {
  const location = useLocation();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Handle success message display and scroll to top after form submission
  useEffect(() => {
    if (location.state?.applicationSubmitted) {
      console.log('📋 Application submitted - showing success message and scrolling to top');
      setShowSuccessMessage(true);
      
      // Immediately scroll to top after successful submission
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Clear the state and hide message after 10 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // General scroll-to-top effect for homepage to ensure consistent behavior
  useEffect(() => {
    // Only scroll to top if we're coming from a form submission or initial load
    if (location.state?.applicationSubmitted || !document.referrer.includes(window.location.origin)) {
      console.log('🔝 Scrolling to top of homepage');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Log success for QA purposes
      setTimeout(() => {
        if (window.scrollY > 100) {
          console.error('❌ Homepage scroll-to-top failed - user not at top after redirect');
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

      {/* Hero Section */}
      <HeroSection />

      {/* Company Logos Carousel */}
      <CompanyLogosCarousel />

      {/* Mentors Carousel Section */}
      <MentorsCarousel />

      {/* Investment Partners Section */}
      <InvestmentPartnersSection />

      {/* Horizon/Programs Section */}
      <HorizonSection />

      {/* Call to Action Section */}
      <CtaSection />
    </div>
  );
};

export default Index;
