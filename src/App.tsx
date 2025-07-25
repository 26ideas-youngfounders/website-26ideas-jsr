
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

const queryClient = new QueryClient();

/**
 * Main App component with routing and layout structure
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <Navigation />
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
              <Footer />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
