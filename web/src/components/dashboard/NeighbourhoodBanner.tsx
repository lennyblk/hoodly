import { useEffect, useState } from 'react';
import { useUser } from '../../contexts/useUser';
import api from '../../api/axios';
import type { components } from '../../api/types.generated';

type Neighbourhood = components['schemas']['Neighbourhood'];

export default function NeighbourhoodBanner() {
  const { user } = useUser();
  const [neighbourhood, setNeighbourhood] = useState<Neighbourhood | null>(null);

  useEffect(() => {
    if (user?.neighbourhoodId) {
      api.get<Neighbourhood>(`/neighbourhoods/${user.neighbourhoodId}`)
        .then(({ data }) => setNeighbourhood(data))
        .catch(() => setNeighbourhood(null));
    }
  }, [user?.neighbourhoodId]);

  if (!user?.neighbourhoodId) return null;

  return (
    <div className="mx-8 mt-5 flex items-center justify-between rounded-2xl bg-vert-foret px-6 py-4">
      <div className="flex items-center gap-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-vert-clair shrink-0">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
        </svg>
        <p className="font-sans text-sm font-bold text-white">
          {neighbourhood?.name ?? '…'}
        </p>
      </div>
      <span className="flex items-center gap-1.5 rounded-full bg-vert-moyen px-3 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-vert-clair" />
        <span className="font-sans text-xs font-semibold text-white">Actif</span>
      </span>
    </div>
  );
}
