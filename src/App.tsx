
/**
 * @fileoverview Main application component that sets up the root application structure
 * with authentication, routing, and UI providers for the 26ideas Young Founders platform.
 * 
 * This component serves as the entry point for the entire application and provides
 * the necessary context providers for React Query, authentication, tooltips, and toasts.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

// UI Components and Providers
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// External Libraries
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Internal Components and Hooks
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import MentorSignup from "./pages/MentorSignup";
import PhoneInputTest from "./pages/PhoneInputTest";
import YffLandingPage from "./pages/YffLandingPage";
import YffTeamInformation from "./pages/YffTeamInformation";
import YffQuestionnaire from "./pages/YffQuestionnaire";
import NotFound from "./pages/NotFound";

// Admin Components
import CrmDashboard from "./pages/admin/CrmDashboard";

/**
 * React Query client configuration
 * Handles API caching, background refetching, and error handling
 */
const queryClient = new QueryClient();

/**
 * Main Application Component
 * 
 * Sets up the application with the following provider hierarchy:
 * 1. QueryClientProvider - Manages server state and caching
 * 2. AuthProvider - Handles user authentication state
 * 3. TooltipProvider - Enables tooltip functionality across the app
 * 4. BrowserRouter - Manages client-side routing
 * 
 * @returns {JSX.Element} The complete application with all necessary providers
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        {/* Toast notifications for user feedback */}
        <Toaster />
        <Sonner />
        
        {/* Application routing */}
        <BrowserRouter>
          <Routes>
            {/* Home page - landing page for visitors */}
            <Route path="/" element={<Index />} />
            
            {/* Mentor signup page - for users wanting to become mentors */}
            <Route path="/community/mentors" element={<MentorSignup />} />
            
            {/* Young Founders Floor competition routes */}
            <Route path="/young-founders-floor" element={<YffLandingPage />} />
            <Route path="/yff" element={<YffLandingPage />} />
            <Route path="/yff/team-information" element={<YffTeamInformation />} />
            <Route path="/yff/questionnaire" element={<YffQuestionnaire />} />
            
            {/* Admin CRM System Routes */}
            <Route path="/admin/crm-dashboard" element={<CrmDashboard />} />
            
            {/* Phone input test page - for testing the new component */}
            <Route path="/test/phone-input" element={<PhoneInputTest />} />
            
            {/* Catch-all route for 404 errors - MUST be last */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
