// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import FarmUpdates from './pages/FarmUpdates'; 
import FarmUpdateDetail from './pages/FarmDetails'; 
import Farms from './pages/Farms';
import FarmDetails from './pages/FarmDetails'; 
import LandPurchase from './pages/LandPurchase';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import PrivateRoute from './components/PrivateRoute';
import Admin from './pages/Admin';
import KYC from './pages/KYC'; // Import KYC page
import Onboarding from './pages/Onboarding'; // Import Onboarding page
import SignUp from './pages/SignUp';
import Login from './pages/Login';

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

  // Determine if the current route is login or any other routes that shouldn't show the sidebar
  const isLoginPage = location.pathname === '/login';
  const isSignUpPage = location.pathname === '/signup'; 
  const isOnboardingPage = location.pathname === '/onboarding';
  const isKYCPage = location.pathname === '/kyc'; // Add check for KYC page

  return (
    <div className="flex">
      {/* Only render Sidebar on non-login, non-signup, and non-kyc pages */}
      {!isLoginPage && !isSignUpPage && !isOnboardingPage && !isKYCPage && <Sidebar />}
      <div className="flex-1 p-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} /> 
          <Route path="/kyc" element={<KYC />} /> {/* KYC page route */}
          <Route path="/onboarding" element={<Onboarding />} /> {/* Onboarding page route */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/farm-updates" element={<FarmUpdates />} />
          <Route path="/farm-updates/:updateId" element={<FarmUpdateDetail />} />
          <Route path="/farms" element={<Farms />} />
          <Route path="/farms/:farmId" element={<FarmDetails />} /> 
          <Route path="/land-purchase" element={<LandPurchase />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:reportId" element={<ReportDetail />} />
          <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
        </Routes>
      </div>
    </div>
  );
};

export default App;









