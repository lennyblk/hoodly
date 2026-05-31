import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useUser } from '../../contexts/useUser';
import type { components } from '../../api/types.generated';

type Event = components['schemas']['Event'];
type Vote = components['schemas']['Vote'];

interface TopNeighbour {
  userId: string;
  firstName: string;
  lastName: string;
  attendCount: number;
}

interface RecommendItem {
  icon: string;
  label: string;
  title: string;
  sub: string;
  badge: string;
  badgeColor: string;
}

export default function RecommendedSection() {
  const { user } = useUser();
  const [items, setItems] = useState<RecommendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const nid = user?.neighbourhoodId;
    if (!nid) { setLoading(false); return; }

    Promise.allSettled([
      api.get<TopNeighbour | null>('/neo4j/top-attendee', { params: { neighbourhoodId: nid } }),
      api.get<Vote[]>('/votes', { params: { neighbourhoodId: nid } }),
      api.get<Event[]>('/events', { params: { neighbourhoodId: nid } }),
    ]).then(([neighbourRes, votesRes, eventsRes]) => {
      const result: RecommendItem[] = [];

      // Top voisin
      if (neighbourRes.status === 'fulfilled' && neighbourRes.value.data) {
        const top = neighbourRes.value.data;
        result.push({
          icon: '🏆',
          label: 'Voisin le plus sociable',
          title: `${top.firstName} ${top.lastName}`,
          sub: 'Participe à tous les events',
          badge: `${top.attendCount} event${top.attendCount > 1 ? 's' : ''}`,
          badgeColor: 'bg-ambre',
        });
      }

      // Vote qui expire bientôt (dans les 48h)
      if (votesRes.status === 'fulfilled') {
        const soon = votesRes.value.data
          .filter((v) => new Date(v.endsAt) > new Date())
          .sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime())[0];
        if (soon) {
          const hoursLeft = Math.round((new Date(soon.endsAt).getTime() - Date.now()) / 3600000);
          result.push({
            icon: '🗳️',
            label: 'Vote bientôt terminé',
            title: soon.question,
            sub: 'Donnez votre avis',
            badge: hoursLeft < 24 ? `${hoursLeft}h restantes` : `${Math.round(hoursLeft / 24)}j restants`,
            badgeColor: hoursLeft < 24 ? 'bg-[#EF4444]' : 'bg-[#7C3AED]',
          });
        }
      }

      // Prochain événement
      if (eventsRes.status === 'fulfilled') {
        const next = eventsRes.value.data
          .filter((e) => new Date(e.date) > new Date())
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
        if (next) {
          const date = new Date(next.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
          result.push({
            icon: '📅',
            label: 'Prochain événement',
            title: next.title,
            sub: next.description ?? '',
            badge: date,
            badgeColor: 'bg-vert-moyen',
          });
        }
      }

      setItems(result);
    }).finally(() => setLoading(false));
  }, [user?.neighbourhoodId]);

  return (
    <div className="flex flex-col rounded-2xl bg-charbon overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-5 pb-4">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-vert-clair">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2" />
        </svg>
        <span className="font-sans text-xs font-bold tracking-widest text-vert-clair uppercase">Recommandé</span>
      </div>

      <div className="flex flex-col px-3 pb-4 gap-1">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse mx-1" />
          ))
        ) : items.length === 0 ? (
          <p className="font-sans text-xs text-white/40 px-3 pb-2">Rien à recommander pour l'instant.</p>
        ) : (
          items.map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/5 transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-base shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-xs text-white/40 uppercase tracking-wide leading-none mb-0.5">{item.label}</p>
                <p className="font-sans text-sm font-semibold text-white truncate">{item.title}</p>
                <p className="font-sans text-xs text-white/50 truncate">{item.sub}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 font-sans text-xs font-bold text-white ${item.badgeColor}`}>
                {item.badge}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
