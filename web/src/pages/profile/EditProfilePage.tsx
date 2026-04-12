import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/useUser';
import api from '../../api/axios';
import type { components } from '../../api/types.generated';

type Neighbourhood = components['schemas']['Neighbourhood'];

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  neighbourhoodId: string;
}

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user, fetchMe } = useUser();

  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    neighbourhoodId: '',
  });
  const [neighbourhoods, setNeighbourhoods] = useState<Neighbourhood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      password: '',
      confirmPassword: '',
      neighbourhoodId: user.neighbourhoodId ?? '',
    });
  }, [user]);

  useEffect(() => {
    api.get<Neighbourhood[]>('/neighbourhoods')
      .then(({ data }) => setNeighbourhoods(data))
      .catch(() => { });
  }, []);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError(null);
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?._id) return;

    if (form.password && form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload: Record<string, string> = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      neighbourhoodId: form.neighbourhoodId,
    };
    if (form.password) payload.password = form.password;

    try {
      await api.patch(`/users/${String(user._id)}`, payload as any);
      await fetchMe();
      setSuccess(true);
      setForm((f) => ({ ...f, password: '', confirmPassword: '' }));
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Une erreur est survenue.'));
    } finally {
      setLoading(false);
    }
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

          {/* Quartier */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-sm font-semibold text-charbon">Quartier</label>
            <select
              value={form.neighbourhoodId}
              onChange={(e) => set('neighbourhoodId', e.target.value)}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">— Aucun quartier —</option>
              {neighbourhoods.map((n) => (
                <option key={String(n.id)} value={String(n.id)}>
                  {n.name}
                </option>
              ))}
            </select>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-vert-foret py-3.5 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>

        </form>
      </div>
    </div>
  );
}
