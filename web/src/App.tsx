import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

type Page = 'login' | 'signup';

function App() {
  const [page, setPage] = useState<Page>('login');

  if (page === 'signup') {
    return <SignupPage onGoToLogin={() => setPage('login')} />;
  }

  return <LoginPage onGoToSignup={() => setPage('signup')} />;
}

export default App;
