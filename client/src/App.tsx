import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Lab from "./pages/Lab";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Progress from "./pages/Progress";
import Workout from "./pages/Workout";
import Library from "./pages/Library";
import Nutrition from "./pages/Nutrition";
import Arena from "./pages/Arena";
import Vault from "./pages/Vault";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected Tactical Modules */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/lab" element={<Lab />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/workout" element={<Workout />} />
              <Route path="/library" element={<Library />} />
              <Route path="/nutrition" element={<Nutrition />} />
              <Route path="/arena" element={<Arena />} />
              <Route path="/vault" element={<Vault />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
