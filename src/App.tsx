import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/hooks/use-language";
import { UserProvider } from "@/context/user-context";
import { MarketplaceProvider } from "@/context/marketplace-context";
import { GodModeProvider } from "@/context/godmode-context";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import TradeFlow from "@/pages/trade-flow";
import CompanyMap from "@/pages/company-map";
import Analysis from "@/pages/analysis";
import AlertsCenter from "@/pages/alerts-center";
import SouthAmericaAnalysis from "@/pages/south-america-analysis";
import ExpansionDashboard from "@/pages/expansion-dashboard";
import CoverageDashboard from "@/pages/dashboard-coverage";
import Marketplace from "@/pages/marketplace";
import MarketplacePage from "@/pages/MarketplacePage";
import AdminGuard from "@/guards/AdminGuard";
import AuthGuard from "@/guards/AuthGuard";
import AdminLayout from "@/pages/admin/AdminLayout";
import CommandCenterPage from "@/pages/admin/CommandCenterPage";
import AnalyticsPage from "@/pages/admin/AnalyticsPage";
import CompanyProfile from "@/pages/company-profile";
import ChatPage from "@/pages/chat";
import ChatPageNew from "@/pages/ChatPage";
import ChatConversationPage from "@/pages/chat-conversation";
import JoinChat from "@/pages/join-chat";
import ProfilePage from "@/pages/profile";
import NewsPage from "@/pages/news";
import AuthPage from "@/pages/auth";
import CheckoutSuccessPage from "@/pages/checkout-success";
import OnboardingPage from "@/pages/onboarding";
import SubscriptionPage from "@/pages/SubscriptionPage";
import VendorDashboardPage from "@/pages/VendorDashboardPage";
import ControlPanel from "@/pages/ControlPanel";
import FeedbackHistory from "@/pages/FeedbackHistory";
import { AlertsTicker } from "@/components/alerts-ticker";
import GodModeOrb from "@/components/godmode/GodModeOrb";
import IncotermsPage from "@/pages/IncotermsPage";
import { useLocation } from "wouter";
import { RouteBackground } from "@/design-system/RouteBackground";
import CookieBanner from "@/components/legal/CookieBanner";

import TermsPage from "@/pages/legal/TermsPage";
import PrivacyPage from "@/pages/legal/PrivacyPage";
import AcceptableUsePage from "@/pages/legal/AcceptableUsePage";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white p-8 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Algo salió mal</h1>
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 max-w-2xl w-full overflow-auto">
            <p className="font-mono text-sm text-red-400 mb-2">{this.state.error?.toString()}</p>
            <pre className="font-mono text-xs text-slate-400 whitespace-pre-wrap">
              {this.state.errorInfo?.componentStack}
            </pre>
          </div>
          <button 
            className="mt-6 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            onClick={() => window.location.href = '/'}
          >
            Volver al Inicio
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

import DesignSystemPage from '@/pages/DesignSystemPage';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard">
        <AuthGuard>
          <Home />
        </AuthGuard>
      </Route>
      <Route path="/analysis" component={Analysis} />
      <Route path="/trade-flow" component={TradeFlow} />
      <Route path="/map" component={CompanyMap} />
      <Route path="/company-map" component={CompanyMap} />
      <Route path="/south-america" component={SouthAmericaAnalysis} />
      <Route path="/alerts" component={AlertsCenter} />
      <Route path="/expansion-dashboard" component={ExpansionDashboard} />
      <Route path="/coverage" component={CoverageDashboard} />
      <Route path="/marketplace" component={MarketplacePage} />
      <Route path="/marketplace/dashboard" component={VendorDashboardPage} />
      <Route path="/incoterms" component={IncotermsPage} />
      <Route path="/market-legacy" component={Marketplace} />
      
      {/* Admin Panel V2 Routing */}
      <Route path="/admin">
        <AdminGuard>
          <AdminLayout>
            <CommandCenterPage />
          </AdminLayout>
        </AdminGuard>
      </Route>
      <Route path="/admin/analytics">
        <AdminGuard>
          <AdminLayout>
            <AnalyticsPage />
          </AdminLayout>
        </AdminGuard>
      </Route>

      <Route path="/profile" component={ProfilePage} />
      <Route path="/news" component={NewsPage} />
      <Route path="/company/:id" component={CompanyProfile} />
      <Route path="/chat" component={ChatPageNew} />
      <Route path="/chat/:id" component={ChatPageNew} />
      <Route path="/join-chat/:token" component={JoinChat} />
      <Route path="/landing" component={Landing} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/checkout/success" component={CheckoutSuccessPage} />
      <Route path="/subscription" component={SubscriptionPage} />
      <Route path="/control-panel" component={ControlPanel} />
      <Route path="/control-panel/historial" component={FeedbackHistory} />
      <Route path="/subscription/success" component={CheckoutSuccessPage} />
      <Route path="/subscription/cancel" component={SubscriptionPage} />
      
      {/* Legal Pages */}
      <Route path="/legal/terms" component={TermsPage} />
      <Route path="/legal/privacy" component={PrivacyPage} />
      <Route path="/legal/acceptable-use" component={AcceptableUsePage} />

      {/* Design System Reference Page - Only for Figma export & Dev */}
      {import.meta.env.DEV && <Route path="/design-system" component={DesignSystemPage} />}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith('/admin');
  
  return (
    <ErrorBoundary>
      <div className="main-content">
        {!isAdminRoute && <RouteBackground />}
        {!isAdminRoute && <CookieBanner />}
        <AlertsTicker />
        <Router />
        <GodModeOrb />
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <UserProvider>
          <MarketplaceProvider>
            <GodModeProvider>
              <TooltipProvider>
                <Toaster />
                <AppContent />
              </TooltipProvider>
            </GodModeProvider>
          </MarketplaceProvider>
        </UserProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
