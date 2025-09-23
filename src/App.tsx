// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import FarmUpdates from './pages/FarmUpdates'; 
import FarmUpdateDetail from './pages/FarmDetails'; 
import Farms from './pages/Farms';
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
import PlotPurchase from './pages/PlotPurchase';
import EnviroTraceResults from './components/Dashboard';
import DashboardPage2 from './pages/DashboardPage2';
import DashboardPage from './pages/DashboardPage';
import Checkout from './pages/Checkout';
import EnvironmentWeatherPage from './pages/DashboardPage';
import EnvironmentResults from './pages/DashboardPage2';
import FarmDashboard from './pages/FarmUpdates';
import AuthCallback from './pages/AuthCallback';

const App: React.FC = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

// The routes and sidebar logic will go inside a separate component
const AppRoutes: React.FC = () => {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('isAuthenticated'); // Check for authentication status

  // If not authenticated, redirect to login page on the default route
  if (!isAuthenticated && location.pathname === '/') {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex">
      {/* Only render Sidebar on non-login, non-signup, and non-kyc pages */}
      {!location.pathname.startsWith('/login') && !location.pathname.startsWith('/signup') && !location.pathname.startsWith('/onboarding') && !location.pathname.startsWith('/kyc') && <Sidebar />}
      <div className="flex-1 p-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} /> 
          <Route path="/kyc" element={<KYC />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/envirotrace" element={<PrivateRoute><EnvironmentWeatherPage /></PrivateRoute>} />
          <Route path="/checkout" element={<PrivateRoute><Checkout  /></PrivateRoute>} />
          <Route  path="/envirotrace/results"  element={<PrivateRoute><EnvironmentResults /></PrivateRoute>} />
          <Route path="/dashboard/farm/:farmId" element={<PrivateRoute><FarmDashboard /></PrivateRoute>} />
          <Route path="/farm-updates" element={<PrivateRoute><FarmUpdateDetail /></PrivateRoute>} />
          <Route path="/farms/:farmId" element={<PrivateRoute><FarmDetails /></PrivateRoute>} />
          <Route path="/land-purchase" element={<PrivateRoute><LandPurchase /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="/reports/:id" element={<PrivateRoute><ReportDetail /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;










