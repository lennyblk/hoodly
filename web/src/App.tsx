import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { UserProvider } from './contexts/UserContext';
import { useUser } from './contexts/useUser';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ServicesPage from './pages/services/ServicesPage';
import ServiceDetailPage from './pages/services/ServiceDetailPage';
import ProposeServicePage from './pages/services/ProposeServicePage';
import ContractPage from './pages/services/ContractPage';
import MapPage from './pages/map/MapPage';
import EventsPage from './pages/events/EventsPage';
import EventDetailPage from './pages/events/EventDetailPage';
import MessagesPage from './pages/messages/MessagesPage';
import VotesPage from './pages/votes/VotesPage';
import VoteDetailPage from './pages/votes/VoteDetailPage';
import DocumentsPage from './pages/documents/DocumentsPage';
import ProfilePage from './pages/profile/ProfilePage';
import EditProfilePage from './pages/profile/EditProfilePage';
import AdminPage from './pages/admin/AdminPage';
import SelectNeighbourhoodPage from './pages/neighbourhood/SelectNeighbourhoodPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

function ProtectedRoutes() {
  const token = localStorage.getItem('access_token');
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function AdminRoutes() {
  const { user } = useUser();
  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function AppRoutes() {
  const { fetchMe } = useUser();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchMe()
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        })
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) return null;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route element={<ProtectedRoutes />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/new" element={<ProposeServicePage />} />
          <Route path="/services/:id" element={<ServiceDetailPage />} />
          <Route path="/services/:id/contract" element={<ContractPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/votes" element={<VotesPage />} />
          <Route path="/votes/:id" element={<VoteDetailPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route element={<AdminRoutes />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          <Route path="/select-neighbourhood" element={<SelectNeighbourhoodPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </BrowserRouter>
  );
}
