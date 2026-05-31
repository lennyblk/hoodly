import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useUser } from '../../contexts/useUser';
import type { components } from '../../api/types.generated';

type Announcement = components['schemas']['Announcement'];
type Vote = components['schemas']['Vote'];

interface ActivityItem {
  text: string;
  time: string;
  dot: string;
  sortKey: number;
}

function timeAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `il y a ${diff}s`;
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

export default function RecentActivity() {
  const { user } = useUser();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.neighbourhoodId) { setLoading(false); return; }
    const nid = user.neighbourhoodId;

    Promise.allSettled([
      api.get<Announcement[]>('/announcements', { params: { neighbourhoodId: nid } }),
      api.get<Vote[]>('/votes', { params: { neighbourhoodId: nid } }),
    ]).then(([annRes, voteRes]) => {
      const activity: ActivityItem[] = [];

      if (annRes.status === 'fulfilled') {
        annRes.value.data.forEach((a) => {
          activity.push({
            text: a.type === 'offer'
              ? `Nouvelle offre : ${a.title}`
              : `Demande d'aide : ${a.title}`,
            time: timeAgo(a.createdAt as unknown as string),
            dot: a.type === 'offer' ? 'bg-vert-moyen' : 'bg-ambre',
            sortKey: new Date(a.createdAt as unknown as string).getTime(),
          });
        });
      }

      if (voteRes.status === 'fulfilled') {
        voteRes.value.data.forEach((v) => {
          activity.push({
            text: `Vote ouvert : ${v.question}`,
            time: timeAgo(v.createdAt as unknown as string),
            dot: 'bg-[#7C3AED]',
            sortKey: new Date(v.createdAt as unknown as string).getTime(),
          });
        });
      }

      setItems(activity.sort((a, b) => b.sortKey - a.sortKey).slice(0, 5));
    }).finally(() => setLoading(false));
  }, [user?.neighbourhoodId]);

  return (
    <div className="flex flex-col rounded-2xl bg-white border border-sable/40 overflow-hidden">
      <div className="px-5 py-4 border-b border-sable/30">
        <h3 className="font-sans text-sm font-bold text-charbon">Activité récente</h3>
      </div>

      <div className="flex flex-col divide-y divide-sable/20">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3.5">
              <div className="mt-1.5 h-2 w-2 rounded-full bg-sable/30 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 rounded bg-sable/20 animate-pulse" />
                <div className="h-2.5 w-1/4 rounded bg-sable/20 animate-pulse" />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <p className="font-sans text-xs text-sable px-5 py-4">Aucune activité récente.</p>
        ) : (
          items.map((a, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3.5">
              <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${a.dot}`} />
              <div>
                <p className="font-sans text-sm text-charbon leading-snug">{a.text}</p>
                <p className="font-sans text-xs text-sable mt-0.5">{a.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
