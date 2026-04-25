import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Onboarding from './pages/Onboarding/Onboarding';
import ProfileSetup from './pages/Profile/ProfileSetup';
import Dashboard from './pages/Dashboard/Dashboard';
import Settings from './pages/Settings/Settings';
import History from './pages/History/History';
import FAQ from './pages/Settings/FAQ';
import Subscription from './pages/Settings/Subscription';
import Analyzer from './pages/Analyzer/Analyzer';
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';
import TermsOfService from './pages/Legal/TermsOfService';
import PrivacyPolicy from './pages/Legal/PrivacyPolicy';
import AdminCashPayment from './pages/Admin/AdminCashPayment.jsx';
import SubscriptionSuccess from './pages/Subscription/Success.jsx';

// Components
import Navbar from './components/Navigation/Navbar';

// Styles
import './styles/globals.css';

// Layout wrapper for authenticated pages
const AuthenticatedLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

function App() {
  return (
    <Router>
      <AuthProvider>
          <Toaster position="top-right" />
          <Routes>
            {/* Public routes (no navbar) */}
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/cash-payment" element={<AdminCashPayment />}/>
            <Route path="/subscription/success" element={<SubscriptionSuccess />}/>

            {/* Authenticated routes (with navbar) */}
            <Route path="/" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Dashboard />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <ProfileSetup editMode={true} />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <AdminDashboard />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Settings />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/history" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <History />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings/faq" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <FAQ />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings/subscription" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Subscription />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/cash-payment" element={
              <ProtectedRoute> 
                <AuthenticatedLayout>
                  <AdminCashPayment />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/analyzer" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Analyzer />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;