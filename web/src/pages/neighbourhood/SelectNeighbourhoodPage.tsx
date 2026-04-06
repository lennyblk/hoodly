import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import api from '../../api/axios';
import type { components } from '../../api/types.generated';

type Neighbourhood = components['schemas']['Neighbourhood'];

export default function SelectNeighbourhoodPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, fetchMe } = useUser();

  const [neighbourhoods, setNeighbourhoods] = useState<Neighbourhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const from: string = (location.state as { from?: string })?.from ?? '/dashboard';

  useEffect(() => {
    api.get<Neighbourhood[]>('/neighbourhoods')
      .then(({ data }) => setNeighbourhoods(data))
      .finally(() => setLoading(false));
  }, []);

  async function handleSelect(neighbourhoodId: string) {
    if (!user?._id) return;
    setSaving(neighbourhoodId);
    try {
      await api.patch(`/users/${String(user._id)}`, { neighbourhoodId: String(neighbourhoodId) } as any);
      await fetchMe();
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('PATCH /users error:', JSON.stringify(err?.response?.data));
      setSaving(null);
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* En-tête */}
      <div className="px-4 lg:px-8 pt-8 pb-4">
        <h1 className="font-heading text-2xl font-bold text-charbon">Choisissez votre quartier</h1>
        <p className="font-sans text-sm text-sable mt-1">
          Vous n'êtes relié à aucun quartier. Sélectionnez le vôtre pour continuer.
        </p>
      </div>

      {/* Contenu */}
      <div className="flex-1 flex justify-center px-4 lg:px-8 py-4">
        <div className="w-full max-w-[600px]">

          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-sable/20 animate-pulse" />
              ))}
            </div>
          ) : neighbourhoods.length === 0 ? (
            <div className="rounded-2xl border border-sable/40 bg-white px-6 py-10 text-center">
              <p className="font-sans text-sm text-sable">Aucun quartier disponible pour le moment.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {neighbourhoods.map((n) => (
                <button
                  key={n.id}
                  disabled={saving !== null}
                  onClick={() => handleSelect(String(n.id))}
                  className="flex items-center justify-between rounded-2xl border border-sable/40 bg-white px-5 py-4 text-left transition-all hover:border-vert-moyen hover:shadow-sm disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5EE] font-sans text-xl">
                      🏘️
                    </span>
                    <span className="font-sans text-sm font-semibold text-charbon">{n.name}</span>
                  </div>
                  {saving === n.id ? (
                    <span className="font-sans text-xs text-sable">En cours…</span>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-sable">
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
