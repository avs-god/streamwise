import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Decisions from "@/pages/Decisions";
import Home from "@/pages/Home";
import ProviderPage from "@/pages/ProviderPage";
import Wallet from "@/pages/Wallet";
import Watchlist from "@/pages/Watchlist";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/watchlist" component={Watchlist} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/decisions" component={Decisions} />
      <Route path="/providers/:slug" component={ProviderPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
