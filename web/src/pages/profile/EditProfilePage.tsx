import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/useUser';
import api from '../../api/axios';
import { otpApi } from '../../api/otp';
import type { components } from '../../api/types.generated';
import { useAddressAutocomplete } from '../../hooks/useAddressAutocomplete';

type Neighbourhood = components['schemas']['Neighbourhood'];

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  password: string;
  confirmPassword: string;
}

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user, fetchMe } = useUser();

  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [neighbourhood, setNeighbourhood] = useState<Neighbourhood | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const addressSuggestions = useAddressAutocomplete(form.address);

  const [otpStep, setOtpStep] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Record<string, string> | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      address: user.address ?? '',
      password: '',
      confirmPassword: '',
    });
  }, [user]);

  useEffect(() => {
    if (!user?.neighbourhoodId) {
      setNeighbourhood(null);
      return;
    }
    api.get<Neighbourhood>(`/neighbourhoods/${user.neighbourhoodId}`)
      .then(({ data }) => setNeighbourhood(data))
      .catch(() => { });
  }, [user?.neighbourhoodId]);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError(null);
    setSuccess(false);
  }

  function selectAddress(value: string) {
    set('address', value);
    setShowAddressSuggestions(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?._id) return;

    if (form.password && form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    const payload: Record<string, string> = {
      firstName: form.firstName,
      lastName: form.lastName,
    };
    const emailChanged = form.email !== user.email;
    const passwordChanged = !!form.password;
    const addressChanged = form.address !== (user.address ?? '');
    if (emailChanged) payload.email = form.email;
    if (passwordChanged) payload.password = form.password;
    if (addressChanged) payload.address = form.address;

    setLoading(true);
    setError(null);

    if (!emailChanged && !passwordChanged && !addressChanged) {
      await submitPatch(payload);
      return;
    }

    setPendingPayload(payload);
    try {
      const { data } = await otpApi.send(user.email, user.firstName);
      if ((data as any)?.bypassed) {
        await completeWithOtp(payload, '000000');
      } else {
        setOtpStep(true);
        setLoading(false);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Impossible d\'envoyer le code OTP.'));
      setLoading(false);
    }
  }

  async function completeWithOtp(payload: Record<string, string>, code: string) {
    setOtpLoading(true);
    setOtpError('');
    try {
      const { data } = await otpApi.verify(user!.email, code);
      await submitPatch({ ...payload, otpToken: data.otpToken });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setOtpError(Array.isArray(msg) ? msg[0] : (msg ?? 'Code incorrect'));
      setOtpLoading(false);
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length < 6 || !pendingPayload) return;
    await completeWithOtp(pendingPayload, code);
  }

  async function submitPatch(payload: Record<string, string>) {
    try {
      await api.patch('/users/me', payload);
      await fetchMe();
      setSuccess(true);
      setForm((f) => ({ ...f, password: '', confirmPassword: '' }));
      setOtpStep(false);
      setOtpDigits(['', '', '', '', '', '']);
      setPendingPayload(null);
    } catch (err: any) {
      const status = err?.response?.status;
      if (payload.otpToken && status === 400) {
        setOtpError('OTP token manquant');
      } else if (payload.otpToken && status === 401) {
        setOtpError('Code OTP expiré, recommence');
      } else {
        const msg = err?.response?.data?.message;
        setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Une erreur est survenue.'));
      }
    } finally {
      setLoading(false);
      setOtpLoading(false);
    }
  }

  function handleOtpDigitChange(index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = char;
    setOtpDigits(next);
    if (char && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  }

  function cancelOtpStep() {
    setOtpStep(false);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
    setPendingPayload(null);
    setLoading(false);
  }

  const inputClass = 'w-full rounded-xl border border-sable bg-white px-4 py-3 font-sans text-sm text-charbon outline-none placeholder:text-sable focus:border-vert-moyen transition-colors';

  return (
    <div className="flex flex-col min-h-full">

      {/* En-tête */}
      <div className="flex items-center gap-3 px-4 lg:px-8 pt-6 pb-4">
        <button
          onClick={() => navigate('/profile')}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-sable bg-white text-charbon hover:bg-creme transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <h1 className="font-heading text-xl font-bold text-charbon">Modifier mon profil</h1>
          <p className="font-sans text-xs text-sable">Nom, email, quartier, mot de passe</p>
        </div>
      </div>

      <div className="flex-1 flex justify-center px-4 lg:px-8 py-4">
        <form onSubmit={handleSubmit} className="w-full max-w-[600px] flex flex-col gap-5">

          {/* Nom */}
          <div>
            <p className="font-sans text-sm font-semibold text-charbon mb-3">Identité</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs text-sable">Prénom</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                  placeholder="Jean"
                  className={inputClass}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs text-sable">Nom</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                  placeholder="Dupont"
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-sm font-semibold text-charbon">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="jean.dupont@email.com"
              className={inputClass}
              required
            />
          </div>

          {/* Adresse */}
          <div className="flex flex-col gap-1.5 relative">
            <label className="font-sans text-sm font-semibold text-charbon">Adresse</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => { set('address', e.target.value); setShowAddressSuggestions(true); }}
              onFocus={() => setShowAddressSuggestions(true)}
              onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 150)}
              placeholder="Ex: 15 rue de la Paix, 75018 Paris"
              autoComplete="off"
              className={inputClass}
              required
            />
            {showAddressSuggestions && addressSuggestions.length > 0 && (
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
            <p className="font-sans text-xs text-sable">
              Quartier : {neighbourhood ? (
                <span className="font-medium text-charbon/70">{neighbourhood.name}</span>
              ) : (
                <span className="italic">aucun — en attente d'attribution</span>
              )}
              {' '}(déterminé automatiquement depuis votre adresse)
            </p>
          </div>

          {/* Mot de passe */}
          <div>
            <p className="font-sans text-sm font-semibold text-charbon mb-1">Nouveau mot de passe</p>
            <p className="font-sans text-xs text-sable mb-3">Laissez vide pour ne pas changer</p>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs text-sable">Mot de passe</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs text-sable">Confirmer</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          {/* Vérification OTP — requise si email ou mot de passe modifié */}
          {otpStep && (
            <div className="flex flex-col gap-4 rounded-xl border border-vert-moyen/30 bg-[#E8F5EE] px-4 py-4">
              <div>
                <p className="font-sans text-sm font-semibold text-charbon">Vérification de sécurité</p>
                <p className="font-sans text-xs text-sable mt-1">
                  Code envoyé à <span className="font-semibold text-charbon">{user?.email}</span>
                </p>
              </div>
              <div className="flex gap-2 justify-between">
                {otpDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleOtpDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    className="h-12 w-full rounded-xl border-2 border-sable bg-white text-center font-sans text-lg font-bold text-charbon outline-none transition-colors focus:border-vert-moyen"
                  />
                ))}
              </div>
              {otpError && (
                <p className="rounded-lg bg-red-100 px-3 py-2 font-sans text-xs text-red-700">{otpError}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cancelOtpStep}
                  className="flex-1 rounded-xl border border-sable py-2.5 font-sans text-sm font-semibold text-charbon hover:bg-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleOtpSubmit}
                  disabled={otpLoading || otpDigits.join('').length < 6}
                  className="flex-1 rounded-xl bg-vert-foret py-2.5 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpLoading ? 'Vérification…' : 'Confirmer le code'}
                </button>
              </div>
            </div>
          )}

          {/* Feedback */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <p className="font-sans text-sm text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="rounded-xl bg-[#E8F5EE] border border-vert-moyen/30 px-4 py-3">
              <p className="font-sans text-sm text-vert-moyen font-semibold">Profil mis à jour avec succès.</p>
            </div>
          )}

          {!otpStep && (
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-vert-foret py-3.5 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
          )}

        </form>
      </div>
    </div>
  );
}
