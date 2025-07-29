import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/hooks/useAuth';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignUpPage from '@/pages/SignUpPage';
import Dashboard from '@/pages/Dashboard';
import ProfilePage from '@/pages/ProfilePage';
import YffTeamRegistration from '@/pages/YffTeamRegistration';
import YffQuestionnaire from '@/pages/YffQuestionnaire';
import YffConversationalQuestionnaire from '@/pages/YffConversationalQuestionnaire';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/young-founders-floor" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/yff/team-registration" element={<YffTeamRegistration />} />
            <Route path="/yff/questionnaire" element={<YffQuestionnaire />} />
            
            {/* Add the new conversational questionnaire route */}
            <Route path="/yff/questionnaire/conversational" element={<YffConversationalQuestionnaire />} />
            
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
