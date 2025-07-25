
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import Index from "./pages/Index";
import { YffLandingPage } from "./pages/YffLandingPage";
import { YffTeamRegistration } from "./pages/YffTeamRegistration";
import YffQuestionnaire from "./pages/YffQuestionnaire";
import YffTeamInformation from "./pages/YffTeamInformation";
import MentorSignup from "./pages/MentorSignup";
import AnnualRetreat from "./pages/AnnualRetreat";
import NotFound from "./pages/NotFound";
import CrmDashboard from "./pages/admin/CrmDashboard";
import YffApplicationsPage from "./pages/admin/YffApplicationsPage";
import MentorApplicationsPage from "./pages/admin/MentorApplicationsPage";
import PhoneInputTest from "./pages/PhoneInputTest";
import { startLayoutMonitoring } from "./utils/layout-debug";
import { useEffect } from "react";

const queryClient = new QueryClient();

/**
 * Main App component with routing and layout structure
 * 
 * CRITICAL LAYOUT RULES:
 * =====================
 * 1. This file is the ONLY place where Navigation and Footer should be rendered
 * 2. All pages inherit the global layout from here
 * 3. Individual pages should NEVER import Navigation or Footer directly
 * 4. Any violation of these rules will cause duplicate headers/footers
 * 
 * Layout Structure:
 * - Global Navigation (rendered once here)
 * - Main content area (pages are rendered here)
 * - Global Footer (rendered once here)
 * 
 * @returns {JSX.Element} Complete app with global layout
 */
function App() {
  // Critical debug logging to prevent future layout duplicates
  console.log('🏗️ App component rendering - This is the ONLY place Navigation/Footer should appear');
  console.log('🚫 NEVER import Navigation/Footer in individual page components');
  console.log('📋 All pages inherit layout from App.tsx global wrapper');
  
  // Start layout monitoring in development to catch duplicates
  useEffect(() => {
    startLayoutMonitoring();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              {/* 
                🔴 CRITICAL: Single Navigation component for entire app
                This is the ONLY place Navigation should be rendered
                DO NOT import Navigation in any page component
              */}
              <Navigation />
              
              {/* Main content area - pages inherit layout from here */}
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/young-founders-floor" element={<YffLandingPage />} />
                  <Route path="/yff/team-registration" element={<YffTeamRegistration />} />
                  <Route path="/yff/questionnaire" element={<YffQuestionnaire />} />
                  <Route path="/yff/team-information" element={<YffTeamInformation />} />
                  <Route path="/community/mentors" element={<MentorSignup />} />
                  <Route path="/events/annual-retreat" element={<AnnualRetreat />} />
                  <Route path="/admin/crm" element={<CrmDashboard />} />
                  <Route path="/admin/yff-applications" element={<YffApplicationsPage />} />
                  <Route path="/admin/mentor-applications" element={<MentorApplicationsPage />} />
                  <Route path="/phone-input-test" element={<PhoneInputTest />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              
              {/* 
                🔴 CRITICAL: Single Footer component for entire app
                This is the ONLY place Footer should be rendered
                DO NOT import Footer in any page component
              */}
              <Footer />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
