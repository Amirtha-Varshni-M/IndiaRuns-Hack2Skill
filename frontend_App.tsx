import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { getToken } from "@/lib/auth";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import RankingResultsPage from "@/pages/RankingResultsPage";
import CandidatesPage from "@/pages/CandidatesPage";
import JobsPage from "@/pages/JobsPage";
import AdminPage from "@/pages/AdminPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import AppLayout from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

setAuthTokenGetter(() => getToken());

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  if (!getToken()) return <Redirect to="/login" />;
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/" component={() => <PrivateRoute component={DashboardPage} />} />
      <Route path="/ranking/:jobId" component={() => <PrivateRoute component={RankingResultsPage} />} />
      <Route path="/candidates" component={() => <PrivateRoute component={CandidatesPage} />} />
      <Route path="/jobs" component={() => <PrivateRoute component={JobsPage} />} />
      <Route path="/admin" component={() => <PrivateRoute component={AdminPage} />} />
      <Route path="/analytics" component={() => <PrivateRoute component={AnalyticsPage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "hsl(215 22% 11%)",
              border: "1px solid hsl(215 14% 20%)",
              color: "hsl(213 27% 90%)",
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
