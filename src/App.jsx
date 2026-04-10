import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { Toast } from './components/Toast';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { IssueItem } from './pages/IssueItem';
import { RecentActivity } from './pages/RecentActivity';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Staff } from './pages/Staff';
import { Alerts } from './pages/Alerts';
import { Reports } from './pages/Reports';
import { SettingsPage } from './pages/Settings';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser } = useAppContext();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/issue-item" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<Layout />}>
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
        <AppRoutes />
        <Toast />
      </AppProvider>
    </BrowserRouter>
  );
}
