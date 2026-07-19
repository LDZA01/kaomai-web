import React, { createContext, useContext } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import EmployerDashboard from './pages/employer/EmployerDashboard';
import CreateJob from './pages/employer/CreateJob';
import Matches from './pages/employer/Matches';
import Matching from './pages/shelter/Matching';
import Residents from './pages/shelter/Residents';
import ShelterDashboard from './pages/shelter/ShelterDashboard';
import useAuth from './hooks/useAuth';
import type { OrgInfo } from './hooks/useAuth';
import type { UserProfile } from './types';

// ─── Auth Context ────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: UserProfile | null;
  org: OrgInfo;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ user: unknown; error: null | { message: string } }>;
  signUp: (
    email: string,
    password: string,
    role: UserProfile['role'],
    displayName: string,
    orgInfo?: { shelterName?: string; shelterAddress?: string; businessName?: string; industry?: string },
  ) => Promise<{ user: unknown; error: null | { message: string } }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
};

// ─── Protected Route ─────────────────────────────────────────────────────────
const ProtectedRoute = ({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: 'shelter' | 'employer';
}) => {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <Navigate
        to={user.role === 'employer' ? '/employer/dashboard' : '/shelter/dashboard'}
        replace
      />
    );
  }

  return <>{children}</>;
};

// ─── Root Redirect ────────────────────────────────────────────────────────────
const RootRedirect = () => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'employer' ? '/employer/dashboard' : '/shelter/dashboard'} replace />;
};

// ─── Auth Redirect (login/register when already logged in) ────────────────────
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuthContext();

  if (loading) return null;
  if (user) {
    return <Navigate to={user.role === 'employer' ? '/employer/dashboard' : '/shelter/dashboard'} replace />;
  }
  return <>{children}</>;
};

// ─── App Shell ────────────────────────────────────────────────────────────────
const AppShell = () => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <Navbar />
          <div className="mx-auto flex max-w-7xl">
            <Sidebar />
            <main className="min-h-[calc(100vh-57px)] flex-1 p-4 sm:p-6">
              <Routes>
                {/* Root */}
                <Route path="/" element={<RootRedirect />} />

                {/* Auth pages — redirect away if already logged in */}
                <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
                <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />

                {/* Shelter pages — shelter role only */}
                <Route path="/shelter/dashboard" element={<ProtectedRoute requiredRole="shelter"><ShelterDashboard /></ProtectedRoute>} />
                <Route path="/shelter/residents" element={<ProtectedRoute requiredRole="shelter"><Residents /></ProtectedRoute>} />
                <Route path="/shelter/matching" element={<ProtectedRoute requiredRole="shelter"><Matching /></ProtectedRoute>} />

                {/* Employer pages — employer role only */}
                <Route path="/employer/dashboard" element={<ProtectedRoute requiredRole="employer"><EmployerDashboard /></ProtectedRoute>} />
                <Route path="/employer/create-job" element={<ProtectedRoute requiredRole="employer"><CreateJob /></ProtectedRoute>} />
                <Route path="/employer/matches" element={<ProtectedRoute requiredRole="employer"><Matches /></ProtectedRoute>} />

                {/* Fallback */}
                <Route path="*" element={<RootRedirect />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

export default AppShell;
