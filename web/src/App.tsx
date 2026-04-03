import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import AppLayout from './components/layout/AppLayout';
import { UserProvider, useUser } from './contexts/UserContext';

type Page = 'login' | 'signup' | 'dashboard';

function AppContent() {
  const [page, setPage] = useState<Page>('login');
  const { fetchMe } = useUser();

  async function handleLoggedIn() {
    await fetchMe();
    setPage('dashboard');
  }

  if (page === 'signup') {
    return <SignupPage onGoToLogin={() => setPage('login')} />;
  }

  if (page === 'dashboard') {
    return (
      <AppLayout>
        <DashboardPage />
      </AppLayout>
    );
  }

  return <LoginPage onGoToSignup={() => setPage('signup')} onLoggedIn={handleLoggedIn} />;
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
