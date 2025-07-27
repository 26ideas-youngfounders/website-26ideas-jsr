
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import Index from "./pages/Index";
import AnnualRetreat from "./pages/AnnualRetreat";
import { YffLandingPage } from "./pages/YffLandingPage";
import YffQuestionnaire from "./pages/YffQuestionnaire";
import { YffTeamRegistration } from "./pages/YffTeamRegistration";
import YffTeamInformation from "./pages/YffTeamInformation";
import MentorSignup from "./pages/MentorSignup";
import PhoneInputTest from "./pages/PhoneInputTest";
import NotFound from "./pages/NotFound";
import { CrmDashboard } from "./pages/admin/CrmDashboard";
import { YffApplicationsPage } from "./pages/admin/YffApplicationsPage";
import MentorApplicationsPage from "./pages/admin/MentorApplicationsPage";
import { startLayoutMonitoring } from "./utils/layout-debug";
import { useEffect } from "react";

const queryClient = new QueryClient();

function App() {
  // Start layout monitoring in development
  useEffect(() => {
    startLayoutMonitoring();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-background flex flex-col">
              <Navigation />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/events/annual-retreat" element={<AnnualRetreat />} />
                  <Route path="/young-founders-floor" element={<YffLandingPage />} />
                  <Route path="/yff/team-registration" element={<YffTeamRegistration />} />
                  <Route path="/yff/questionnaire" element={<YffQuestionnaire />} />
                  <Route path="/yff/team-information" element={<YffTeamInformation />} />
                  <Route path="/community/mentors" element={<MentorSignup />} />
                  <Route path="/phone-input-test" element={<PhoneInputTest />} />
                  <Route path="/admin/crm" element={<CrmDashboard />} />
                  <Route path="/admin/yff-applications" element={<YffApplicationsPage />} />
                  <Route path="/admin/mentor-applications" element={<MentorApplicationsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
            <Toaster />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
