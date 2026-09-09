import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { Toast } from './components/Toast';
import { Layout } from './components/Layout';
import { Operations } from './pages/Operations';
import { Login } from './pages/Login';
import { IssueItem } from './pages/IssueItem';
import { RecentActivity } from './pages/RecentActivity';
import { Products } from './pages/Products';
import { Staff } from './pages/Staff';
import { Alerts } from './pages/Alerts';
import { SettingsPage } from './pages/Settings';
import { Profile } from './pages/Profile';
import './pages/Suite.css';
import './pages/Operations.css';

const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Reports = lazy(() => import('./pages/Reports').then(module => ({ default: module.Reports })));
const Revenue = lazy(() => import('./pages/Revenue').then(module => ({ default: module.Revenue })));

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, authReady, cloudStatus } = useAppContext();
  if (!authReady) return <p role="status">Verifying staff access…</p>;

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/issue-item" replace />;
  }
  if (cloudStatus === 'error') return <div className="ops-card" role="alert"><h2>Shared records are unavailable</h2><p>Check your connection and staff access, then retry. Your saved cloud records have not been deleted.</p><button className="btn btn-primary" onClick={() => window.location.reload()}>Retry connection</button></div>;
  if (cloudStatus !== 'ready') return <p role="status">Loading shared hotel records…</p>;

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['Front Desk', 'Admin']}><Profile /></ProtectedRoute>} />
        {/* Front Desk & Admin */}
        <Route path="/issue-item" element={
          <ProtectedRoute allowedRoles={['Front Desk', 'Admin']}>
            <IssueItem />
          </ProtectedRoute>
        } />
        <Route path="/activity" element={
          <ProtectedRoute allowedRoles={['Front Desk', 'Admin']}>
            <RecentActivity />
          </ProtectedRoute>
        } />

        {['shuttle', 'breakfast', 'housekeeping', 'expenses'].map(section => <Route key={section} path={`/operations/${section}`} element={<ProtectedRoute allowedRoles={['Front Desk', 'Admin']}><Operations key={section} section={section} /></ProtectedRoute>} />)}
        {/* Admin Only */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/products" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <Products />
          </ProtectedRoute>
        } />
        <Route path="/admin/alerts" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <Alerts />
          </ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="/admin/revenue" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <Revenue />
          </ProtectedRoute>
        } />
        <Route path="/admin/staff" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <Staff />
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <SettingsPage />
          </ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Suspense fallback={<p role="status" style={{ padding: '2rem' }}>Loading page…</p>}><AppRoutes /></Suspense>
        <Toast />
      </AppProvider>
    </BrowserRouter>
  );
}
