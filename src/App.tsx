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
import NotFound from "./pages/NotFound";

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
            
            {/* Catch-all route for 404 errors - MUST be last */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
