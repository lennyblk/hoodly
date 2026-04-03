import { useState, FormEvent } from 'react';
import axios from 'axios';
import { authApi } from '../api/auth';

interface Props {
  onGoToSignup: () => void;
  onLoggedIn: () => void;
}

export default function LoginPage({ onGoToSignup, onLoggedIn }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await authApi.signin({ email, password });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      onLoggedIn();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        setError(Array.isArray(msg) ? msg[0] : msg ?? 'Identifiants invalides.');
      } else {
        setError('Impossible de joindre le serveur.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full w-full">

      {/* ── Panneau gauche — branding ── */}
      <div className="hidden lg:flex w-[420px] shrink-0 flex-col justify-between bg-vert-foret p-10">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ambre">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
                stroke="#1E4D35" strokeWidth="2" strokeLinejoin="round" fill="#F8F4ED"
              />
              <path d="M9 21V12h6v9" stroke="#1E4D35" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-sans text-xl font-bold tracking-tight text-white">Hoodly</span>
        </div>

        {/* Tagline */}
        <div>
          <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-white">
            Votre quartier,<br />connecté.
          </h1>
          <p className="mt-4 font-sans text-sm leading-relaxed text-vert-clair/90">
            Rejoignez votre communauté locale, partagez des annonces et restez informé de ce qui se passe près de chez vous.
          </p>
        </div>

        {/* Features */}
        <div className="flex flex-col gap-3">
          {[
            { icon: '🏘️', label: 'Quartiers actifs' },
            { icon: '📢', label: 'Annonces de voisinage' },
            { icon: '🤝', label: 'Services entre voisins' },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-3 rounded-xl bg-white/[0.08] px-4 py-3"
            >
              <span className="text-lg">{f.icon}</span>
              <span className="font-sans text-sm font-medium text-white">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="flex flex-1 items-center justify-center bg-creme px-6 py-10">
        <div className="w-full max-w-[420px]">

          {/* Logo mobile */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ambre">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
                  stroke="#1E4D35" strokeWidth="2" strokeLinejoin="round" fill="#F8F4ED"
                />
                <path d="M9 21V12h6v9" stroke="#1E4D35" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-sans text-lg font-bold tracking-tight text-charbon">Hoodly</span>
          </div>

          <div className="mb-8">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-charbon">
              Bon retour
            </h2>
            <p className="mt-1.5 font-sans text-sm text-sable">
              Connectez-vous à votre compte
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="font-sans text-sm font-semibold text-charbon">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                className="w-full rounded-xl border border-sable bg-white px-4 py-3 font-sans text-sm text-charbon outline-none placeholder:text-sable focus:border-vert-moyen"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="font-sans text-sm font-semibold text-charbon">
                  Mot de passe
                </label>
                <a href="#" className="font-sans text-xs text-vert-moyen hover:underline">
                  Mot de passe oublié ?
                </a>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-sable bg-white px-4 py-3 font-sans text-sm text-charbon outline-none placeholder:text-sable focus:border-vert-moyen"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-100 px-4 py-2.5 font-sans text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl bg-ambre py-3.5 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-7 text-center font-sans text-sm text-sable">
            Pas encore de compte ?{' '}
            <button onClick={onGoToSignup} className="font-semibold text-vert-moyen hover:underline">
              Créer un compte
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
