import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useUser } from '../../contexts/useUser';

interface Event {
  id: string;
  title: string;
  description: string;
  type: 'contract' | 'other';
  organizerId: string;
  neighbourhoodId: string;
  date: string;
  participants: string[];
  interestUsers: string[];
  createdAt: string;
}

const THUMBNAILS = [
  { bg: '#E8F4ED', emoji: '🎉' },
  { bg: '#FFF3E0', emoji: '🌿' },
  { bg: '#E3F2FD', emoji: '🏃' },
  { bg: '#FCE4EC', emoji: '🍳' },
  { bg: '#F3E5F5', emoji: '🎨' },
  { bg: '#E8EAF6', emoji: '🤝' },
  { bg: '#FFF8E1', emoji: '🎵' },
];

const AVATAR_COLORS = ['#1E4D35', '#E07B39', '#52B788', '#F4A261', '#2D6A4F', '#C8B89A'];

function getThumbnail(id: string) {
  return THUMBNAILS[id.charCodeAt(id.length - 1) % THUMBNAILS.length];
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [intLoading, setIntLoading] = useState(false);
  const [nameMap, setNameMap] = useState<Map<string, string>>(new Map());

  async function fetchEvent() {
    try {
      const { data } = await api.get<Event>(`/events/${id}`);
      setEvent(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (!event?.neighbourhoodId) return;
    api.get<{ _id: string; firstName: string; lastName: string }[]>(
      `/users/neighbourhood?neighbourhoodId=${event.neighbourhoodId}`
    ).then(({ data }) => {
      const map = new Map<string, string>();
      data.forEach((u) => map.set(u._id.toString(), `${u.firstName} ${u.lastName}`));
      setNameMap(map);
    }).catch(() => {});
  }, [event?.neighbourhoodId]);

  async function handleRsvp() {
    if (!user || !event) return;
    setRsvpLoading(true);
    try {
      await api.post(`/events/${event.id}/rsvp`, { userId: user._id });
      await fetchEvent();
    } finally {
      setRsvpLoading(false);
    }
  }

  async function handleInterest() {
    if (!user || !event) return;
    setIntLoading(true);
    try {
      await api.post(`/events/${event.id}/interest`, { userId: user._id });
      await fetchEvent();
    } finally {
      setIntLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-charbon/40">
        Chargement...
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-charbon/40">
        <span className="text-4xl">😕</span>
        <p>Événement introuvable.</p>
        <button
          onClick={() => navigate('/events')}
          className="text-vert-foret text-sm font-medium hover:underline"
        >
          Retour aux événements
        </button>
      </div>
    );
  }

  const isParticipant = event.participants?.includes(user?._id ?? '');
  const isInterested = event.interestUsers?.includes(user?._id ?? '');
  const isPast = new Date(event.date) < new Date();
  const { bg, emoji } = getThumbnail(event.id);

  return (
    <div className="flex flex-col h-full bg-creme">
      {/* Cover */}
      <div
        className="relative h-48 flex-shrink-0 flex items-end p-5"
        style={{ backgroundColor: bg }}
      >
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white rounded-full w-9 h-9 flex items-center justify-center text-charbon hover:bg-sable/20 transition-colors leading-none outline-none shadow-sm z-10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="absolute inset-0 flex items-center justify-center text-6xl select-none pointer-events-none">
          {emoji}
        </div>
        <h1 className="relative z-10 font-heading text-2xl font-bold text-charbon drop-shadow-sm">
          {event.title}
        </h1>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Info row */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 px-5 py-4 border-b border-sable/20 bg-white">
          <span className="text-sm text-charbon/60">
            📅 <span className="capitalize">{formatFullDate(event.date)}</span>
          </span>
          <span className="text-sm text-charbon/60">🕐 {formatTime(event.date)}</span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full self-center ${
              event.type === 'contract'
                ? 'bg-ambre/15 text-ambre'
                : 'bg-vert-clair/15 text-vert-foret'
            }`}
          >
            {event.type === 'contract' ? 'Contractuel' : 'Général'}
          </span>
        </div>

        <div className="px-5 py-5 space-y-6">
          {/* Description */}
          <section>
            <h2 className="font-heading font-semibold text-charbon mb-2">Description</h2>
            <p className="text-charbon/70 text-sm leading-relaxed">{event.description}</p>
          </section>

          {/* Participants */}
          <section>
            <h2 className="font-heading font-semibold text-charbon mb-3">
              Participants ({event.participants?.length ?? 0})
            </h2>
            {(event.participants?.length ?? 0) === 0 ? (
              <p className="text-sm text-charbon/40 italic">Aucun participant pour l'instant.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(event.participants ?? []).slice(0, 10).map((pid, i) => (
                  <div
                    key={pid}
                    className="h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm px-3"
                    style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {nameMap.get(pid) ?? '—'}
                  </div>
                ))}
                {(event.participants?.length ?? 0) > 10 && (
                  <div className="h-8 rounded-full bg-sable/30 flex items-center justify-center text-charbon/60 text-xs font-bold px-3">
                    +{event.participants.length - 10}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Tags */}
          <section className="flex gap-2 flex-wrap">
            <span className="text-xs bg-sable/20 text-charbon/60 px-3 py-1 rounded-full">
              Présentiel
            </span>
            <span className="text-xs bg-sable/20 text-charbon/60 px-3 py-1 rounded-full">
              Collectif
            </span>
          </section>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="px-5 py-4 bg-white border-t border-sable/20 flex gap-3">
        {isPast ? (
          <div className="flex-1 py-3 rounded-xl text-sm font-medium text-center bg-sable/15 text-charbon/40 border border-sable/20">
            Événement passé
          </div>
        ) : (
          <>
            <button
              onClick={handleInterest}
              disabled={intLoading}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-colors ${
                isInterested
                  ? 'border-vert-clair text-vert-foret bg-vert-clair/10'
                  : 'border-sable text-charbon/70 hover:border-vert-foret hover:text-vert-foret'
              }`}
            >
              {isInterested ? '★ Intéressé' : "S'intéresser"}
            </button>
            <button
              onClick={handleRsvp}
              disabled={rsvpLoading}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                isParticipant
                  ? 'bg-vert-foret/20 text-vert-foret border border-vert-foret/30'
                  : 'bg-vert-foret text-white hover:bg-vert-moyen'
              }`}
            >
              {rsvpLoading ? '...' : isParticipant ? 'Se désinscrire' : 'Participer'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
