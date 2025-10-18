// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import FarmDetails from './pages/FarmDetails';
import LandPurchase from './pages/LandPurchase';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import PrivateRoute from './components/PrivateRoute';
import Admin from './pages/Admin';
import KYC from './pages/KYC';
import Onboarding from './pages/Onboarding';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import EnvironmentWeatherPage from './pages/DashboardPage';
import EnvironmentResults from './pages/DashboardPage2';
import FarmDashboard from './pages/FarmUpdates';
import AuthCallback from './pages/AuthCallback';
import "leaflet/dist/leaflet.css";
import FarmLanding from './pages/FarmLanding';
import { useSupabaseSession } from './context/SupabaseSessionProvider';

const App: React.FC = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

const AppRoutes: React.FC = () => {
  const location = useLocation();

  // ✅ CALL HOOKS AT THE TOP – no early returns before this
  const { loading, session } = useSupabaseSession();

  if (loading) {
    return <div style={{ padding: 24 }}>Restoring session…</div>;
  }

  const showSidebar =
    !location.pathname.startsWith('/login') &&
    !location.pathname.startsWith('/signup') &&
    !location.pathname.startsWith('/onboarding') &&
    !location.pathname.startsWith('/kyc');

  return (
    <div className="flex">
      {showSidebar && <Sidebar />}
      <div className="flex-1 p-8">
        <Routes>
          {/* Default route: send to dashboard if authed, else login */}
          <Route
            path="/"
            element={<Navigate to={session ? "/envirotrace" : "/login"} replace />}
          />

          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Onboarding / KYC */}
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/kyc-review" element={<KYC />} />

          {/* Public farm landing */}
          <Route path="/farm" element={<FarmLanding />} />

          {/* Private (gated by PrivateRoute using Supabase session) */}
          <Route
            path="/envirotrace"
            element={
              <PrivateRoute>
                <EnvironmentWeatherPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/envirotrace/results"
            element={
              <PrivateRoute>
                <EnvironmentResults />
              </PrivateRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <PrivateRoute>
                <Checkout />
              </PrivateRoute>
            }
          />
          <Route
            path="/farm/:slug"
            element={
              <PrivateRoute>
                <FarmDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/land/:slug"
            element={
              <PrivateRoute>
                <FarmDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/land-purchase"
            element={
              <PrivateRoute>
                <LandPurchase />
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <Reports />
              </PrivateRoute>
            }
          />
          <Route
            path="/reports/:id"
            element={
              <PrivateRoute>
                <ReportDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <Admin />
              </PrivateRoute>
            }
          />

          {/* 404 fallback */}
          <Route
            path="*"
            element={<Navigate to={session ? "/envirotrace" : "/login"} replace />}
          />
        </Routes>
      </div>
    </div>
  );
};

export default App;










