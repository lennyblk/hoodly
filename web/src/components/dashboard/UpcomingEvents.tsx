import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useUser } from '../../contexts/useUser';
import type { components } from '../../api/types.generated';

type Event = components['schemas']['Event'];

const COLORS = [
  { color: 'bg-[#E8E4F7]', iconColor: 'text-[#7C3AED]' },
  { color: 'bg-[#FDE8D8]', iconColor: 'text-ambre' },
  { color: 'bg-[#D8F3DC]', iconColor: 'text-vert-moyen' },
];

export default function UpcomingEvents() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.neighbourhoodId) { setLoading(false); return; }
    api
      .get<Event[]>('/events', { params: { neighbourhoodId: user.neighbourhoodId } })
      .then(({ data }) => {
        const upcoming = data
          .filter((e) => new Date(e.date) > new Date())
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3);
        setEvents(upcoming);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.neighbourhoodId]);

  return (
    <div className="flex flex-col rounded-2xl bg-white border border-sable/40 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-sable/30">
        <h3 className="font-sans text-sm font-bold text-charbon">Événements à venir</h3>
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-1 font-sans text-xs font-semibold text-vert-moyen hover:underline"
        >
          Voir tout
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col divide-y divide-sable/20">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <div className="h-9 w-9 rounded-xl bg-sable/20 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-2/3 rounded bg-sable/20 animate-pulse" />
                <div className="h-2.5 w-1/2 rounded bg-sable/20 animate-pulse" />
              </div>
            </div>
          ))
        ) : events.length === 0 ? (
          <p className="font-sans text-xs text-sable px-5 py-4">Aucun événement à venir.</p>
        ) : (
          events.map((event, i) => {
            const { color, iconColor } = COLORS[i % COLORS.length];
            const date = new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
            const attendees = event.participants?.length ?? 0;
            return (
              <div key={String(event.id)} className="flex items-center gap-4 px-5 py-3.5 hover:bg-creme transition-colors">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${color}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={iconColor}>
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-semibold text-charbon truncate">{event.title}</p>
                  <p className="font-sans text-xs text-sable">{date} · {attendees} inscrits</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
