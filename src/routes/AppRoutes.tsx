import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import { DashboardLayout } from '../layouts';
import { DashboardPage, LoginPage, NotFoundPage } from '../pages';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root path: Redirect directly to /dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Guest / Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Protected Routes utilizing Nested DashboardLayout */}
      <Route
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<DashboardPage />} /> {/* Placeholder page mapping */}
        <Route path="/kpis/company" element={<DashboardPage />} />
        <Route path="/kpis/department" element={<DashboardPage />} />
        <Route path="/kpis/personal" element={<DashboardPage />} />
        <Route path="/tracking-logs" element={<DashboardPage />} />
      </Route>

      {/* Wildcard 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
