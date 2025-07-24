
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import YffLandingPage from "./pages/YffLandingPage";
import YffQuestionnaire from "./pages/YffQuestionnaire";
import YffTeamInformation from "./pages/YffTeamInformation";
import MentorSignup from "./pages/MentorSignup";
import NotFound from "./pages/NotFound";
import PhoneInputTest from "./pages/PhoneInputTest";
import CrmDashboard from "./pages/admin/CrmDashboard";
import YffApplicationsPage from "./pages/admin/YffApplicationsPage";
import MentorApplicationsPage from "./pages/admin/MentorApplicationsPage";
import AdminAuth from "./components/admin/AdminAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
              <Route path="/yff" element={<YffLandingPage />} />
              <Route path="/young-founders-floor" element={<YffLandingPage />} />
            <Route path="/yff/apply" element={<YffQuestionnaire />} />
            <Route path="/yff/team" element={<YffTeamInformation />} />
            <Route path="/mentor-signup" element={<MentorSignup />} />
            <Route path="/phone-test" element={<PhoneInputTest />} />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/crm-dashboard" 
              element={
                <AdminAuth>
                  <CrmDashboard />
                </AdminAuth>
              } 
            />
            <Route 
              path="/admin/yff-applications" 
              element={
                <AdminAuth>
                  <YffApplicationsPage />
                </AdminAuth>
              } 
            />
            <Route 
              path="/admin/mentor-applications" 
              element={
                <AdminAuth>
                  <MentorApplicationsPage />
                </AdminAuth>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
