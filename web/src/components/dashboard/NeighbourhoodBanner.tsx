import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import api from '../../api/axios';
import type { components } from '../../api/types.generated';

type Neighbourhood = components['schemas']['Neighbourhood'];

export default function NeighbourhoodBanner() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [neighbourhood, setNeighbourhood] = useState<Neighbourhood | null>(null);

  useEffect(() => {
    if (user?.neighbourhoodId) {
      api.get<Neighbourhood>(`/neighbourhoods/${user.neighbourhoodId}`)
        .then(({ data }) => setNeighbourhood(data))
        .catch(() => setNeighbourhood(null));
    }
  }, [user?.neighbourhoodId]);

  const membreSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null;

  if (!user?.neighbourhoodId) {
    return (
      <div className="mx-8 mt-5 flex items-center justify-between rounded-2xl bg-vert-foret px-6 py-4">
        <div className="flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-vert-clair shrink-0">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
          </svg>
          <p className="font-sans text-sm text-white/70">Vous n'êtes actuellement dans aucun quartier</p>
        </div>
        <button
          onClick={() => navigate('/select-neighbourhood')}
          className="rounded-full bg-vert-moyen px-4 py-1.5 font-sans text-xs font-semibold text-white hover:bg-vert-clair/20 transition-colors"
        >
          Choisir un quartier
        </button>
      </div>
    );
  }

  return (
    <div className="mx-8 mt-5 flex items-center justify-between rounded-2xl bg-vert-foret px-6 py-4">
      <div className="flex items-center gap-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-vert-clair shrink-0">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
        </svg>
        <div>
          <p className="font-sans text-sm font-bold text-white">
            {neighbourhood?.name ?? '…'}
          </p>
          {membreSince && (
            <p className="font-sans text-xs text-vert-clair/70">Membre depuis {membreSince}</p>
          )}
        </div>
      </div>
      <span className="flex items-center gap-1.5 rounded-full bg-vert-moyen px-3 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-vert-clair" />
        <span className="font-sans text-xs font-semibold text-white">Actif</span>
      </span>
    </div>
  );
}
