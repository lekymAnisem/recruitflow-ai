import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/store/authStore';
import { Spinner } from '@/components/ui/Spinner';
import { AppLayout } from '@/components/layout/AppLayout';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const CandidateRegisterPage = lazy(() => import('@/pages/CandidateRegisterPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const JobsListPage = lazy(() => import('@/pages/JobsListPage'));
const JobDetailPage = lazy(() => import('@/pages/JobDetailPage'));
const CandidatesListPage = lazy(() => import('@/pages/CandidatesListPage'));
const CandidateDetailPage = lazy(() => import('@/pages/CandidateDetailPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center py-20">
      <Spinner size="lg" />
    </div>
  );
}

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function GuestRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    const redirect = user?.role === 'candidate' ? '/' : '/dashboard';
    return <Navigate to={redirect} replace />;
  }

  return <Outlet />;
}

export default function RoutesComponent() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={<PageLoader />}>
            <LandingPage />
          </Suspense>
        }
      />
      <Route element={<GuestRoute />}>
        <Route
          path="/login"
          element={
            <Suspense fallback={<PageLoader />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="/register"
          element={
            <Suspense fallback={<PageLoader />}>
              <RegisterPage />
            </Suspense>
          }
        />
        <Route
          path="/register/candidate"
          element={
            <Suspense fallback={<PageLoader />}>
              <CandidateRegisterPage />
            </Suspense>
          }
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<PageLoader />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="/jobs"
            element={
              <Suspense fallback={<PageLoader />}>
                <JobsListPage />
              </Suspense>
            }
          />
          <Route
            path="/jobs/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <JobDetailPage />
              </Suspense>
            }
          />
          <Route
            path="/candidates"
            element={
              <Suspense fallback={<PageLoader />}>
                <CandidatesListPage />
              </Suspense>
            }
          />
          <Route
            path="/candidates/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <CandidateDetailPage />
              </Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
