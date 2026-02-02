import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from "sonner";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationPreferencesProvider } from "./contexts/NotificationPreferencesContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import Landing from "./pages/Landing";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import LeadEdit from "./pages/LeadEdit";
import LeadNew from "./pages/LeadNew";
import Appointments from "./pages/Appointments";
import CommandCenter from "./pages/CommandCenter";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Onboarding from "./pages/Onboarding";
import UsageDashboard from "./pages/UsageDashboard";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminSettings from "./pages/admin/AdminSettings";
import { AdminRoute, PlanRoute } from "./components/ProtectedRoute";
import Conversations from "./pages/Conversations";
import Automations from "./pages/Automations";
import CreateAutomation from "./pages/CreateAutomation";
import WebhookDocs from "./pages/WebhookDocs";
import Help from "./pages/Help";
import Documentation from "./pages/Documentation";
import { UserSupport } from "./pages/UserSupport";
import Integrations from "./pages/Integrations";
import OpenClawAutomations from "./pages/OpenClawAutomations";
import CaptureForm from "./pages/CaptureForm";

function RedirectToOpenClawCopilot() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/openclaw-automations?tab=copilot");
  }, [setLocation]);
  return null;
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);
  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
      <Route path="/" component={Landing} />
      <Route path="/capture/:token" component={CaptureForm} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/checkout/:planId" component={Checkout} />
      <Route path="/checkout-success" component={CheckoutSuccess} />
      <Route path="/leads" component={Leads} />
      <Route path="/leads/new" component={LeadNew} />
      <Route path="/leads/:id" component={LeadDetail} />
      <Route path="/leads/:id/edit" component={LeadEdit} />
      <Route path="/appointments" component={Appointments} />
      <Route path="/command-center" component={CommandCenter} />
      <Route path="/conversations" component={Conversations} />
      <Route path="/automations">
        {() => (
          <PlanRoute minimumPlan="starter">
            <Automations />
          </PlanRoute>
        )}
      </Route>
      <Route path="/automations/new">
        {() => (
          <PlanRoute minimumPlan="starter">
            <CreateAutomation />
          </PlanRoute>
        )}
      </Route>
      <Route path="/automations/docs">
        {() => (
          <PlanRoute minimumPlan="professional">
            <WebhookDocs />
          </PlanRoute>
        )}
      </Route>
      <Route path="/help" component={Help} />
      <Route path="/docs" component={Documentation} />
      <Route path="/documentation" component={Documentation} />
      <Route path="/support" component={UserSupport} />
      <Route path="/integrations" component={Integrations} />
      <Route path="/openclaw-automations">
        {() => (
          <PlanRoute minimumPlan="professional">
            <OpenClawAutomations />
          </PlanRoute>
        )}
      </Route>
      <Route path="/ai-assistant">
        <RedirectToOpenClawCopilot />
      </Route>
      <Route path="/settings" component={Settings} />
      <Route path="/usage" component={UsageDashboard} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:id" component={BlogPost} />
      <Route path="/analytics">
        {() => (
          <PlanRoute minimumPlan="starter">
            <Analytics />
          </PlanRoute>
        )}
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin">
        {() => (
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        )}
      </Route>
      <Route path="/admin/users">
        {() => (
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        )}
      </Route>
      <Route path="/admin/billing">
        {() => (
          <AdminRoute>
            <AdminBilling />
          </AdminRoute>
        )}
      </Route>
      <Route path="/admin/support">
        {() => (
          <AdminRoute>
            <AdminSupport />
          </AdminRoute>
        )}
      </Route>
      <Route path="/admin/analytics">
        {() => (
          <AdminRoute>
            <AdminAnalytics />
          </AdminRoute>
        )}
      </Route>
      <Route path="/admin/notifications">
        {() => (
          <AdminRoute>
            <AdminNotifications />
          </AdminRoute>
        )}
      </Route>
      <Route path="/admin/logs">
        {() => (
          <AdminRoute>
            <AdminLogs />
          </AdminRoute>
        )}
      </Route>
      <Route path="/admin/settings">
        {() => (
          <AdminRoute>
            <AdminSettings />
          </AdminRoute>
        )}
      </Route>
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <NotificationPreferencesProvider>
        <ThemeProvider defaultTheme="dark">
          <WebSocketProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </WebSocketProvider>
        </ThemeProvider>
      </NotificationPreferencesProvider>
    </ErrorBoundary>
  );
}

export default App;
