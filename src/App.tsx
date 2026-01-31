import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AIAssistantFab } from "@/components/ai/AIAssistantFab";

// Public pages
import Login from "./pages/Login";
import Install from "./pages/Install";

// Protected pages
import Home from "./pages/Home";
import Schedule from "./pages/Schedule";
import Bookings from "./pages/Bookings";
import BookingDetail from "./pages/BookingDetail";
import LiveRide from "./pages/LiveRide";
import Payments from "./pages/Payments";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import Benefits from "./pages/Benefits";
import Partners from "./pages/Partners";
import Telephony from "./pages/Telephony";
import Bradesco from "./pages/Bradesco";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Login />} />
              <Route path="/install" element={<Install />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/home" element={<Home />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/bookings/:id" element={<BookingDetail />} />
                <Route path="/live" element={<LiveRide />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/benefits" element={<Benefits />} />
                <Route path="/partners" element={<Partners />} />
                <Route path="/telephony" element={<Telephony />} />
                <Route path="/bradesco" element={<Bradesco />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <AIAssistantFab />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
