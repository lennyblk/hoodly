import React, { useState } from 'react';
import axios from 'axios';
import { authApi } from '../api/auth';

interface Props {
  onGoToLogin: () => void;
}

const PASSWORD_CHECKS = [
  { label: '8 caractères minimum', test: (p: string) => p.length >= 8 },
  { label: 'Une minuscule', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Une majuscule', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Un chiffre', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Un symbole (!@#…)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function isPasswordValid(password: string) {
  return PASSWORD_CHECKS.every((c) => c.test(password));
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = PASSWORD_CHECKS.map((c) => ({ label: c.label, ok: c.test(password) }));

  return (
    <ul className="mt-2 flex flex-col gap-1">
      {checks.map((c) => (
        <li key={c.label} className="flex items-center gap-2 font-sans text-xs">
          <span className={c.ok ? 'text-vert-clair' : 'text-sable'}>
            {c.ok ? '✓' : '○'}
          </span>
          <span className={c.ok ? 'text-vert-moyen' : 'text-sable'}>{c.label}</span>
        </li>
      ))}
    </ul>
  );
}

export default function SignupPage({ onGoToLogin }: Props) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    lang: 'fr',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // empeche le chargement de la page pour pas perdre les données
    if (!isPasswordValid(form.password)) return;
    setError('');
    setLoading(true);

    try {
      await authApi.signup({ ...form, lang: form.lang as 'fr' | 'en' });
      setSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        setError(Array.isArray(msg) ? msg[0] : msg ?? 'Une erreur est survenue.');
      } else {
        setError('Impossible de joindre le serveur.');
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-sable bg-white px-4 py-3 font-sans text-sm text-charbon outline-none placeholder:text-sable focus:border-vert-moyen';

  return (
    <div className="flex h-full w-full">

      {/* ── Panneau gauche ── */}
      <div className="hidden lg:flex w-[420px] shrink-0 flex-col justify-between bg-vert-foret p-10">

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ambre">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
                stroke="#1E4D35" strokeWidth="2" strokeLinejoin="round" fill="#F8F4ED" />
              <path d="M9 21V12h6v9" stroke="#1E4D35" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-sans text-xl font-bold tracking-tight text-white">Hoodly</span>
        </div>

        <div>
          <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-white">
            Rejoignez<br />votre quartier.
          </h1>
          <p className="mt-4 font-sans text-sm leading-relaxed text-vert-clair/90">
            Créez votre compte en quelques secondes et commencez à interagir avec vos voisins dès aujourd'hui.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {[
            { icon: '🏘️', label: 'Quartiers actifs' },
            { icon: '📢', label: 'Annonces de voisinage' },
            { icon: '🤝', label: 'Services entre voisins' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3 rounded-xl bg-white/[0.08] px-4 py-3">
              <span className="text-lg">{f.icon}</span>
              <span className="font-sans text-sm font-medium text-white">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="flex flex-1 items-center justify-center bg-creme px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-[420px]">

          {/* Logo mobile */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ambre">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
                  stroke="#1E4D35" strokeWidth="2" strokeLinejoin="round" fill="#F8F4ED" />
                <path d="M9 21V12h6v9" stroke="#1E4D35" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-sans text-lg font-bold tracking-tight text-charbon">Hoodly</span>
          </div>

          {success ? (
            /* ── Succès ── */
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-vert-clair/20">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold text-charbon">Compte créé !</h2>
                <p className="mt-2 font-sans text-sm text-sable">
                  Votre compte a bien été créé. Vous pouvez maintenant vous connecter.
                </p>
              </div>
              <button
                onClick={onGoToLogin}
                className="w-full rounded-xl bg-ambre py-3.5 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Se connecter
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="font-heading text-3xl font-bold tracking-tight text-charbon">
                  Créer un compte
                </h2>
                <p className="mt-1.5 font-sans text-sm text-sable">
                  Rejoignez votre communauté de quartier
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                {/* Prénom / Nom */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="firstName" className="font-sans text-sm font-semibold text-charbon">
                      Prénom
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={form.firstName}
                      onChange={(e) => update('firstName', e.target.value)}
                      placeholder="Marie"
                      minLength={2}
                      maxLength={50}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="lastName" className="font-sans text-sm font-semibold text-charbon">
                      Nom
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={form.lastName}
                      onChange={(e) => update('lastName', e.target.value)}
                      placeholder="Leblanc"
                      minLength={2}
                      maxLength={50}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="font-sans text-sm font-semibold text-charbon">
                    Adresse e-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="johndoe@email.com"
                    required
                    className={inputClass}
                  />
                </div>

                {/* Mot de passe */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="font-sans text-sm font-semibold text-charbon">
                    Mot de passe
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder="••••••••"
                    required
                    className={inputClass}
                  />
                  <PasswordStrength password={form.password} />
                </div>

                {/* Langue */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="lang" className="font-sans text-sm font-semibold text-charbon">
                    Langue
                  </label>
                  <select
                    id="lang"
                    value={form.lang}
                    onChange={(e) => update('lang', e.target.value)}
                    className={inputClass}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>

                {error && (
                  <p className="rounded-lg bg-red-100 px-4 py-2.5 font-sans text-sm text-red-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !isPasswordValid(form.password)}
                  className="mt-1 w-full rounded-xl bg-ambre py-3.5 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? 'Création du compte…' : 'Créer mon compte'}
                </button>
              </form>

              <p className="mt-7 text-center font-sans text-sm text-sable">
                Déjà un compte ?{' '}
                <button
                  onClick={onGoToLogin}
                  className="font-semibold text-vert-moyen hover:underline"
                >
                  Se connecter
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
