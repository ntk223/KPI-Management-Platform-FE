import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import { DashboardLayout } from '../layouts';

// Lazy load all page components
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const LoginPage = lazy(() => import('../pages/LoginPage').then(m => ({ default: m.LoginPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const AdminCatalogPage = lazy(() => import('../pages/AdminCatalogPage').then(m => ({ default: m.AdminCatalogPage })));
const KpisDepartmentPage = lazy(() => import('../pages/KpisDepartmentPage'));
const KpisPersonalPage = lazy(() => import('../pages/KpisPersonalPage'));
const TrackingLogsPage = lazy(() => import('../pages/TrackingLogsPage'));
const KpisCompanyPage = lazy(() => import('../pages/KpisCompanyPage'));
const TeamManagementPage = lazy(() => import('../pages/TeamManagementPage'));
const DepartmentOrgPage = lazy(() => import('../pages/DepartmentOrgPage'));
const DirectorReviewPage = lazy(() => import('../pages/DirectorReviewPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));

// A beautiful skeleton screen for page transitions
const SkeletonPage = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="h-24 bg-slate-200 dark:bg-zinc-850 rounded-2xl w-full" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 bg-slate-200 dark:bg-zinc-850 rounded-xl" />
      ))}
    </div>
    <div className="h-80 bg-slate-200 dark:bg-zinc-850 rounded-2xl w-full" />
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<SkeletonPage />}>
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
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/kpis/company" element={<KpisCompanyPage />} />
          <Route path="/kpis/department" element={<KpisDepartmentPage />} />
          <Route path="/kpis/personal" element={<KpisPersonalPage />} />
          <Route path="/tracking-logs" element={<TrackingLogsPage />} />
          <Route path="/team" element={<TeamManagementPage />} />
          <Route path="/org" element={<DepartmentOrgPage />} />
          <Route path="/kpis/evaluation" element={<DirectorReviewPage />} />
          {/* Admin-only routes */}
          <Route path="/admin/catalog" element={<AdminCatalogPage />} />
        </Route>

        {/* Wildcard 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
