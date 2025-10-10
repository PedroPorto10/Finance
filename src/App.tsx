import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Tables from "./pages/Tables";
import Charts from "./pages/Charts";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import BudgetAlerts from "./pages/BudgetAlerts";
import BillReminders from "./pages/BillReminders";
import SavingsGoals from "./pages/SavingsGoals";
import CreditCards from "./pages/CreditCards";
import Investments from "./pages/Investments";
import Export from "./pages/Export";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tables" element={<Tables />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/budget-alerts" element={<BudgetAlerts />} />
            <Route path="/bill-reminders" element={<BillReminders />} />
            <Route path="/savings-goals" element={<SavingsGoals />} />
            <Route path="/credit-cards" element={<CreditCards />} />
            <Route path="/investments" element={<Investments />} />
            <Route path="/export" element={<Export />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </ThemeProvider>
      </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
