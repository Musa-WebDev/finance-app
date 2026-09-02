import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AppLayout from "./components/AppLayout.tsx";

const AuthCallback = lazy(() => import("./pages/auth/Callback.tsx"));
const DashboardPage = lazy(() => import("./pages/dashboard/page.tsx"));
const AccountsPage = lazy(() => import("./pages/accounts/page.tsx"));
const BudgetPage = lazy(() => import("./pages/budget/page.tsx"));
const InvestmentsPage = lazy(() => import("./pages/investments/page.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/budget" element={<BudgetPage />} />
              <Route path="/investments" element={<InvestmentsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </DefaultProviders>
  );
}

function RouteLoading() {
  return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
}
