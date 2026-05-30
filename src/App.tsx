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
import { TradeProvider } from "@/context/trade-context";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import ChatPageNew from "@/pages/ChatPage";
import JoinChat from "@/pages/join-chat";
import ProfilePage from "@/pages/profile";
import NewsPage from "@/pages/news";
import AuthPage from "@/pages/auth";
import CheckoutSuccessPage from "@/pages/checkout-success";
import OnboardingPage from "@/pages/onboarding";
import SubscriptionPage from "@/pages/SubscriptionPage";
import ControlPanel from "@/pages/ControlPanel";
import FeedbackHistory from "@/pages/FeedbackHistory";
import { AlertsTicker } from "@/components/alerts-ticker";
import GodModeOrb from "@/components/godmode/GodModeOrb";
import IncotermsPage from "@/pages/IncotermsPage";
import { useLocation } from "wouter";
import { RouteBackground } from "@/design-system/RouteBackground";
import CookieBanner from "@/components/legal/CookieBanner";
import GlobalLoadingSkeleton from "@/components/ui/GlobalLoadingSkeleton";
import ProductTour from "@/components/ProductTour";

import TermsPage from "@/pages/legal/TermsPage";
import PrivacyPage from "@/pages/legal/PrivacyPage";
import AcceptableUsePage from "@/pages/legal/AcceptableUsePage";

// Lazy Loaded Pages
const TradeFlow = React.lazy(() => import("@/pages/trade-flow"));
const CompanyMap = React.lazy(() => import("@/pages/company-map"));
const Analysis = React.lazy(() => import("@/pages/analysis"));
const AlertsCenter = React.lazy(() => import("@/pages/alerts-center"));
const SouthAmericaAnalysis = React.lazy(() => import("@/pages/south-america-analysis"));
const ExpansionDashboard = React.lazy(() => import("@/pages/expansion-dashboard"));
const CoverageDashboard = React.lazy(() => import("@/pages/dashboard-coverage"));
const MarketplacePage = React.lazy(() => import("@/pages/MarketplacePage"));
const VendorDashboardPage = React.lazy(() => import("@/pages/VendorDashboardPage"));
const Marketplace = React.lazy(() => import("@/pages/marketplace"));
const ChatConversationPage = React.lazy(() => import("@/pages/chat-conversation"));
const CompanyProfile = React.lazy(() => import("@/pages/company-profile"));
const InvestorPage = React.lazy(() => import("@/pages/InvestorPage"));

import AuthGuard from "@/guards/AuthGuard";
import AdminGuard from "@/guards/AdminGuard";
import AdminLayout from "@/pages/admin/AdminLayout";
import CommandCenterPage from "@/pages/admin/CommandCenterPage";
import AnalyticsPage from "@/pages/admin/AnalyticsPage";

import { ErrorBoundary } from "@/components/ErrorBoundary";

import DesignSystemPage from '@/pages/DesignSystemPage';

function Router() {
  return (
    <React.Suspense fallback={<GlobalLoadingSkeleton />}>
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
        
        {/* Investor Mode */}
        <Route path="/investors" component={InvestorPage} />
        <Route component={NotFound} />
      </Switch>
    </React.Suspense>
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
      <ProductTour />
      <CookieBanner />
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <UserProvider>
          <TradeProvider>
            <MarketplaceProvider>
              <GodModeProvider>
                <TooltipProvider>
                  <Toaster />
                  <AppContent />
                </TooltipProvider>
              </GodModeProvider>
            </MarketplaceProvider>
          </TradeProvider>
        </UserProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
