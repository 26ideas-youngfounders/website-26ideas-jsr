
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import Index from "./pages/Index";
import AnnualRetreat from "./pages/AnnualRetreat";
import MentorSignup from "./pages/MentorSignup";
import NotFound from "./pages/NotFound";
import YffLandingPage from "./pages/YffLandingPage";
import PhoneInputTest from "./pages/PhoneInputTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/annual-retreat" element={<AnnualRetreat />} />
              <Route path="/mentor-signup" element={<MentorSignup />} />
              <Route path="/yff" element={<YffLandingPage />} />
              <Route path="/phone-test" element={<PhoneInputTest />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
