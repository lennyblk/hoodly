import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useUser } from '../../contexts/useUser';

interface TopNeighbour {
  userId: string;
  firstName: string;
  lastName: string;
  attendCount: number;
}

interface RecommendedEvent {
  id: string;
  title: string;
  date?: string;
}

export default function RecommendedSection() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [top, setTop] = useState<TopNeighbour | null>(null);
  const [events, setEvents] = useState<RecommendedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = user?._id ? String(user._id) : null;
    const nid = user?.neighbourhoodId;
    if (!nid) { setLoading(false); return; }

    Promise.all([
      api.get<TopNeighbour | null>('/neo4j/top-attendee', { params: { neighbourhoodId: nid } })
        .then(({ data }) => setTop(data))
        .catch(() => {}),
      userId
        ? api.get<RecommendedEvent[]>('/events/recommendations', { params: { userId, neighbourhoodId: nid } })
            .then(({ data }) => setEvents(data ?? []))
            .catch(() => {})
        : Promise.resolve(),
    ]).finally(() => setLoading(false));
  }, [user?._id, user?.neighbourhoodId]);

  const isEmpty = !top && !events.length;

  return (
    <div className="flex flex-col rounded-2xl bg-charbon overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-5 pb-4">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-vert-clair">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2" />
        </svg>
        <span className="font-sans text-xs font-bold tracking-widest text-vert-clair uppercase">Recommandé — Neo4j</span>
      </div>

      <div className="flex flex-col px-3 pb-4 gap-1">
        {loading ? (
          <>
            <div className="h-14 rounded-xl bg-white/5 animate-pulse mx-1 mb-1" />
            <div className="h-14 rounded-xl bg-white/5 animate-pulse mx-1" />
          </>
        ) : isEmpty ? (
          <p className="font-sans text-xs text-white/40 px-3 pb-2">Aucune donnée Neo4j disponible.</p>
        ) : (
          <>
            {top && (
              <div className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/5 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-base shrink-0">
                  🏆
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-xs text-white/40 uppercase tracking-wide leading-none mb-0.5">Voisin le plus sociable</p>
                  <p className="font-sans text-sm font-semibold text-white truncate">{top.firstName} {top.lastName}</p>
                  <p className="font-sans text-xs text-white/50 truncate">Participe à tous les events</p>
                </div>
                <span className="shrink-0 rounded-full px-2.5 py-1 font-sans text-xs font-bold text-white bg-ambre">
                  {top.attendCount} event{top.attendCount > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {events.length > 0 && (
              <>
                {top && <div className="mx-3 my-1 border-t border-white/10" />}
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/5 transition-colors text-left w-full"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-base shrink-0">
                      📅
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-xs text-white/40 uppercase tracking-wide leading-none mb-0.5">Événement suggéré</p>
                      <p className="font-sans text-sm font-semibold text-white truncate">{event.title}</p>
                      {event.date && (
                        <p className="font-sans text-xs text-white/50 truncate">
                          {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full px-2.5 py-1 font-sans text-xs font-bold text-white bg-vert-foret">
                      voir
                    </span>
                  </button>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
