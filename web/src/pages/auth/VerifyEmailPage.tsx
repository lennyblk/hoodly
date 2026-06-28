import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { otpApi } from '../../api/otp';
import { useUser } from '../../contexts/useUser';

const EXPIRY_SECONDS = 5 * 60;

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchMe } = useUser();
  const email: string = (location.state as any)?.email ?? '';
  const firstName: string = (location.state as any)?.firstName ?? '';
  const tokens: { access_token: string; refresh_token: string } | undefined = (location.state as any)?.tokens;

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) navigate('/signup', { replace: true });
  }, [email]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  function handleDigitChange(index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) return;
    setError('');
    setLoading(true);
    try {
      await otpApi.verify(email, code);
      if (tokens) {
        localStorage.setItem('access_token', tokens.access_token);
        localStorage.setItem('refresh_token', tokens.refresh_token);
        await fetchMe();
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        setError(Array.isArray(msg) ? msg[0] : msg ?? 'Code invalide.');
      } else {
        setError('Impossible de joindre le serveur.');
      }
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError('');
    setResent(false);
    try {
      await otpApi.send(email, firstName);
      setSecondsLeft(EXPIRY_SECONDS);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setResent(true);
    } catch {
      setError('Impossible de renvoyer le code.');
    } finally {
      setResending(false);
    }
  }

  const code = digits.join('');

  return (
    <div className="flex h-full w-full">

      {/* ── Panneau gauche — branding ── */}
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
            Une dernière<br />étape.
          </h1>
          <p className="mt-4 font-sans text-sm leading-relaxed text-vert-clair/90">
            Vérifiez votre adresse e-mail pour confirmer votre identité et sécuriser votre compte.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { icon: '🔒', label: 'Compte sécurisé' },
            { icon: '📬', label: 'Code envoyé par email' },
            { icon: '⚡', label: 'Valable 5 minutes' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3 rounded-xl bg-white/[0.08] px-4 py-3">
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
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="#1E4D35" strokeWidth="2" strokeLinejoin="round" fill="#F8F4ED" />
                <path d="M9 21V12h6v9" stroke="#1E4D35" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-sans text-lg font-bold tracking-tight text-charbon">Hoodly</span>
          </div>

          <div className="mb-8">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-vert-foret/10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="#1E4D35" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M22 6l-10 7L2 6" stroke="#1E4D35" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-charbon">Vérifiez votre email</h2>
            <p className="mt-1.5 font-sans text-sm text-sable">
              Nous avons envoyé un code à <span className="font-semibold text-charbon">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex gap-3 justify-between">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  className="h-14 w-full rounded-xl border-2 border-sable bg-white text-center font-sans text-xl font-bold text-charbon outline-none transition-colors focus:border-vert-moyen"
                />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className={`font-sans text-sm ${secondsLeft <= 30 ? 'text-red-500' : 'text-sable'}`}>
                Expire dans {minutes}:{seconds}
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || secondsLeft > EXPIRY_SECONDS - 30}
                className="font-sans text-sm font-semibold text-vert-moyen hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resending ? 'Envoi…' : 'Renvoyer le code'}
              </button>
            </div>

            {resent && (
              <p className="rounded-lg bg-vert-clair/20 px-4 py-2.5 font-sans text-sm text-vert-moyen">
                Un nouveau code a été envoyé.
              </p>
            )}

            {error && (
              <p className="rounded-lg bg-red-100 px-4 py-2.5 font-sans text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full rounded-xl bg-ambre py-3.5 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Vérification…' : 'Confirmer le code'}
            </button>
          </form>

          <p className="mt-7 text-center font-sans text-sm text-sable">
            Mauvaise adresse ?{' '}
            <button onClick={() => navigate('/signup')} className="font-semibold text-vert-moyen hover:underline">
              Recommencer
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
