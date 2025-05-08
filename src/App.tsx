
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import SignupPage from "./components/SignupPage";
import ProfileSetupPage from "./components/ProfileSetupPage";
import SwipePage from "./components/SwipePage";
import NotFound from "./pages/NotFound";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import HotZones from "./pages/HotZones";
import Likers from "./pages/Likers";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Help from "./pages/Help";
import Report from "./pages/Report";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/profile-setup" element={<ProfileSetupPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/swipe" element={<SwipePage />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/likers" element={<Likers />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
            <Route path="/report" element={<Report />} />
            <Route path="/hot-zones" element={<HotZones />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
