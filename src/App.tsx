import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SubscriptionBanner } from "./components/SubscriptionBanner";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import AdminNew from "./pages/AdminNew";
import Viewer from "./pages/Viewer";
import ViewerProtected from "./pages/ViewerProtected";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import StudentPortal from "./pages/StudentPortal";
import StudentRegistration from "./pages/StudentRegistration";
import FeesAdmin from "./pages/FeesAdmin";
import SchoolRegistration from "./pages/SchoolRegistration";
import LicenseGenerator from "./pages/LicenseGenerator";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SubscriptionBanner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/admin" element={<AdminNew />} />
          <Route path="/admin-old" element={<Admin />} />
          <Route path="/viewer" element={<ViewerProtected />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/student-registration" element={<StudentRegistration />} />
          <Route path="/student-portal" element={<StudentPortal />} />
          <Route path="/fees-admin" element={<FeesAdmin />} />
          <Route path="/school-registration" element={<SchoolRegistration />} />
          <Route path="/license-admin" element={<LicenseGenerator />} />
          <Route path="/super-admin" element={<SuperAdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
