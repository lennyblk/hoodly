import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { otpApi } from '../../api/otp';
import { useAddressAutocomplete } from '../../hooks/useAddressAutocomplete';

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
          <span className={c.ok ? 'text-vert-clair' : 'text-sable'}>{c.ok ? '✓' : '○'}</span>
          <span className={c.ok ? 'text-vert-moyen' : 'text-sable'}>{c.label}</span>
        </li>
      ))}
    </ul>
  );
}

export default function SignupPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const addressSuggestions = useAddressAutocomplete(form.address);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function selectAddress(value: string) {
    update('address', value);
    setShowSuggestions(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isPasswordValid(form.password)) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.signup(form);
      await otpApi.send(form.email, form.firstName);
      navigate('/verify-email', { state: { email: form.email, firstName: form.firstName, tokens: data } });
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

  const inputClass = 'w-full rounded-xl border border-sable bg-white px-4 py-3 font-sans text-sm text-charbon outline-none placeholder:text-sable focus:border-vert-moyen';

  return (
    <div className="flex h-full w-full">
      <div className="hidden lg:flex w-[420px] shrink-0 flex-col justify-between bg-vert-foret p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ambre">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="#1E4D35" strokeWidth="2" strokeLinejoin="round" fill="#F8F4ED" />
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

      <div className="flex flex-1 items-center justify-center bg-creme px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ambre">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="#1E4D35" strokeWidth="2" strokeLinejoin="round" fill="#F8F4ED" />
                <path d="M9 21V12h6v9" stroke="#1E4D35" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-sans text-lg font-bold tracking-tight text-charbon">Hoodly</span>
          </div>

          <div className="mb-8">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-charbon">Créer un compte</h2>
            <p className="mt-1.5 font-sans text-sm text-sable">Rejoignez votre communauté de quartier</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="firstName" className="font-sans text-sm font-semibold text-charbon">Prénom</label>
                <input id="firstName" type="text" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} placeholder="Marie" minLength={2} maxLength={50} required className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="lastName" className="font-sans text-sm font-semibold text-charbon">Nom</label>
                <input id="lastName" type="text" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} placeholder="Leblanc" minLength={2} maxLength={50} required className={inputClass} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 relative">
              <label htmlFor="address" className="font-sans text-sm font-semibold text-charbon">Adresse</label>
              <input
                id="address"
                type="text"
                value={form.address}
                onChange={(e) => { update('address', e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Ex: 15 rue de la Paix, 75018 Paris"
                required
                autoComplete="off"
                className={inputClass}
              />
              {showSuggestions && addressSuggestions.length > 0 && (
                <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-sable rounded-xl shadow-lg z-10 overflow-hidden max-h-56 overflow-y-auto">
                  {addressSuggestions.map((s, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectAddress(s.display_name)}
                        className="w-full text-left px-4 py-2.5 font-sans text-sm text-charbon hover:bg-creme transition-colors"
                      >
                        {s.display_name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="font-sans text-sm font-semibold text-charbon">Adresse e-mail</label>
              <input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="johndoe@email.com" required className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="font-sans text-sm font-semibold text-charbon">Mot de passe</label>
              <div className="relative">
                <input id="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="••••••••" required className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sable hover:text-charbon transition-colors">
                  {showPassword
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>
            {error && <p className="rounded-lg bg-red-100 px-4 py-2.5 font-sans text-sm text-red-700">{error}</p>}
            <button
              type="submit" disabled={loading || !isPasswordValid(form.password)}
              className="mt-1 w-full rounded-xl bg-ambre py-3.5 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Création du compte…' : 'Créer mon compte'}
            </button>
          </form>
          <p className="mt-7 text-center font-sans text-sm text-sable">
            Déjà un compte ?{' '}
            <Link to="/login" className="font-semibold text-vert-moyen hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
