import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { useUser } from '../../contexts/useUser';
import { EVENT_EMOJI_CHOICES, getEventVisual } from '../../constants/eventVisuals';
import NoNeighbourhoodState from '../../components/NoNeighbourhoodState';

interface Event {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  neighbourhoodId: string;
  date: string;
  participants: string[];
  interestUsers: string[];
  status?: 'active' | 'cancelled';
  emoji?: string;
  createdAt: string;
}

const DAY_NAMES = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function DateStrip({
  selected,
  onSelect,
}: {
  selected: Date | null;
  onSelect: (d: Date | null) => void;
}) {
  const today = new Date();
  const days: Date[] = [];
  for (let i = -2; i <= 5; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }

  return (
    <div className="flex gap-1">
      {days.map((d, i) => {
        const active = selected && sameDay(d, selected);
        const isToday = sameDay(d, today);
        return (
          <button
            key={i}
            onClick={() => onSelect(active ? null : d)}
            className={`flex flex-col items-center px-3 py-2 rounded-xl transition-all min-w-[44px] ${
              active
                ? 'bg-vert-foret text-white'
                : isToday
                  ? 'bg-vert-foret/10 text-vert-foret'
                  : 'text-charbon/40 hover:bg-sable/20'
            }`}
          >
            <span className="text-[10px] font-medium uppercase tracking-wide">
              {DAY_NAMES[d.getDay()]}
            </span>
            <span className="text-base font-bold leading-tight">{d.getDate()}</span>
          </button>
        );
      })}
    </div>
  );
}

function EventCard({
  event,
  userId,
  onRsvp,
  onInterest,
  neighbourhoodName,
}: {
  event: Event;
  userId: string;
  onRsvp: (id: string) => Promise<void>;
  onInterest: (id: string) => Promise<void>;
  neighbourhoodName?: string;
}) {
  const navigate = useNavigate();
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [intLoading, setIntLoading] = useState(false);
  const isParticipant = event.participants?.includes(userId);
  const isInterested = event.interestUsers?.includes(userId);
  const isPast = new Date(event.date) < new Date();
  const isCancelled = event.status === 'cancelled';
  const isClosed = isPast || isCancelled;
  const { bg, emoji } = getEventVisual(event);
  const count = event.participants?.length ?? 0;

  async function clickRsvp(e: React.MouseEvent) {
    e.stopPropagation();
    setRsvpLoading(true);
    try {
      await onRsvp(event.id);
    } finally {
      setRsvpLoading(false);
    }
  }

  async function clickInterest(e: React.MouseEvent) {
    e.stopPropagation();
    setIntLoading(true);
    try {
      await onInterest(event.id);
    } finally {
      setIntLoading(false);
    }
  }

  return (
    <div
      onClick={() => navigate(`/events/${event.id}`)}
      className="bg-white rounded-2xl p-4 flex gap-4 cursor-pointer hover:shadow-md transition-shadow border border-sable/20 group"
    >
      {/* Thumbnail */}
      <div
        className="w-[72px] h-[72px] rounded-xl flex-shrink-0 flex items-center justify-center text-3xl relative"
        style={{ backgroundColor: bg }}
      >
        {emoji}
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-ambre text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
            {count}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5">
        <h3 className="font-heading font-semibold text-charbon text-[15px] leading-snug line-clamp-1 group-hover:text-vert-foret transition-colors">
          {event.title}
        </h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-charbon/50">
          <span>📅 {formatShortDate(event.date)}</span>
          <span className="text-sable">·</span>
          <span>🕐 {formatTime(event.date)}</span>
        </div>
        <p className="text-xs text-charbon/40 mt-1 line-clamp-1">{event.description}</p>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {neighbourhoodName && (
            <span className="text-[10px] bg-vert-foret/10 text-vert-foret font-medium px-2 py-0.5 rounded-full">
              📍 {neighbourhoodName}
            </span>
          )}
          {isCancelled && (
            <span className="text-[10px] bg-red-500 text-white font-semibold px-2 py-0.5 rounded-full">
              Annulé
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 justify-center flex-shrink-0">
        <button
          onClick={clickInterest}
          disabled={intLoading || isClosed}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${
            isClosed
              ? 'border-sable/30 text-charbon/25 cursor-not-allowed'
              : isInterested
              ? 'border-vert-clair text-vert-foret bg-vert-clair/10'
              : 'border-sable/60 text-charbon/50 hover:border-vert-foret hover:text-vert-foret'
          }`}
        >
          {isInterested ? '★ Intéressé' : "S'intéresser"}
        </button>
        <button
          onClick={clickRsvp}
          disabled={rsvpLoading || isClosed}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
            isClosed
              ? 'bg-sable/20 text-charbon/25 cursor-not-allowed'
              : isParticipant
              ? 'bg-vert-foret/10 text-vert-foret border border-vert-foret/30'
              : 'bg-vert-foret text-white hover:bg-vert-moyen'
          }`}
        >
          {rsvpLoading ? '...' : isCancelled ? 'Annulé' : isPast ? 'Terminé' : isParticipant ? '✓ Inscrit' : 'Participer'}
        </button>
      </div>
    </div>
  );
}

function CreateEventModal({
  onClose,
  onCreated,
  userId,
  neighbourhoodId,
}: {
  onClose: () => void;
  onCreated: () => void;
  userId: string;
  neighbourhoodId: string | undefined;
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    emoji: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!neighbourhoodId) {
      setError('Vous devez rejoindre un quartier avant de créer un événement.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/events', {
        ...form,
        emoji: form.emoji || undefined,
        organizerId: userId,
        neighbourhoodId,
      });
      onCreated();
      onClose();
    } catch {
      setError("Erreur lors de la création de l'événement.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-charbon/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-xl font-bold text-charbon">Créer un événement</h2>
          <button
            onClick={onClose}
            className="text-charbon/40 hover:text-charbon transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charbon/70 mb-1">Titre</label>
            <input
              className="w-full border border-sable rounded-xl px-3 py-2.5 text-charbon text-sm focus:outline-none focus:ring-2 focus:ring-vert-foret/40 focus:border-vert-foret"
              placeholder="Ex : Fête de quartier"
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charbon/70 mb-1">Description</label>
            <textarea
              className="w-full border border-sable rounded-xl px-3 py-2.5 text-charbon text-sm focus:outline-none focus:ring-2 focus:ring-vert-foret/40 focus:border-vert-foret resize-none"
              placeholder="Décrivez votre événement..."
              rows={3}
              required
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charbon/70 mb-1">Date et heure</label>
            <input
              type="datetime-local"
              className="w-full border border-sable rounded-xl px-3 py-2.5 text-charbon text-sm focus:outline-none focus:ring-2 focus:ring-vert-foret/40 focus:border-vert-foret"
              required
              min={new Date().toISOString().slice(0, 16)}
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charbon/70 mb-1">Emoji</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => set('emoji', '')}
                className={`h-9 px-2.5 rounded-xl border text-xs font-medium transition-colors ${
                  form.emoji === ''
                    ? 'border-vert-foret bg-vert-foret/10 text-vert-foret'
                    : 'border-sable/40 text-charbon/50 hover:bg-sable/10'
                }`}
              >
                Auto
              </button>
              {EVENT_EMOJI_CHOICES.map((em) => (
                <button
                  type="button"
                  key={em}
                  onClick={() => set('emoji', em)}
                  className={`w-9 h-9 rounded-xl border text-lg leading-none transition-colors ${
                    form.emoji === em
                      ? 'border-vert-foret bg-vert-foret/10'
                      : 'border-sable/40 hover:bg-sable/10'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-sable text-charbon rounded-xl py-2.5 font-medium text-sm hover:bg-sable/20 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-vert-foret text-white rounded-xl py-2.5 font-medium text-sm hover:bg-vert-moyen transition-colors disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const { user, fetchMe } = useUser();
  const location = useLocation();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'inscrit' | 'interesse'>('all');
  const [search, setSearch] = useState('');
  const [neighbourhoodFilter, setNeighbourhoodFilter] = useState('all');
  const [neighbourhoods, setNeighbourhoods] = useState<{ id: string; name: string }[]>([]);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if ((location.state as { openCreate?: boolean } | null)?.openCreate) {
      setShowModal(true);
    }
  }, [location.state]);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    if (!isAdmin && !user.neighbourhoodId) {
      setLoading(false);
      return;
    }
    try {
      const params = isAdmin ? {} : { neighbourhoodId: user.neighbourhoodId };
      const { data } = await api.get<Event[]>('/events', { params });
      setEvents(data);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (!isAdmin) return;
    api.get<{ id: string; name: string }[]>('/neighbourhoods')
      .then(({ data }) => setNeighbourhoods(data.map((n) => ({ id: String(n.id), name: n.name }))))
      .catch(() => {});
  }, [isAdmin]);

  const neighbourhoodNames = new Map(neighbourhoods.map((n) => [n.id, n.name]));

  async function handleRsvp(eventId: string) {
    if (!user) return;
    await api.post(`/events/${eventId}/rsvp`, { userId: user._id });
    await fetchEvents();
    fetchMe().catch(() => {});
  }

  async function handleInterest(eventId: string) {
    if (!user) return;
    await api.post(`/events/${eventId}/interest`, { userId: user._id });
    await fetchEvents();
  }

  const userId = user?._id ?? '';
  const filtered = events
    .filter((e) => !selectedDate || sameDay(new Date(e.date), selectedDate))
    .filter((e) => {
      if (!search) return true;
      const q = search.toLowerCase();
      const quartier = neighbourhoodNames.get(e.neighbourhoodId)?.toLowerCase() ?? '';
      return e.title.toLowerCase().includes(q) || quartier.includes(q);
    })
    .filter((e) => neighbourhoodFilter === 'all' || e.neighbourhoodId === neighbourhoodFilter)
    .filter((e) => {
      if (statusFilter === 'inscrit') return e.participants?.includes(userId);
      if (statusFilter === 'interesse') return e.interestUsers?.includes(userId);
      return true;
    })
    .sort((a, b) => {
      const now = Date.now();
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      const aFuture = aTime >= now;
      const bFuture = bTime >= now;
      if (aFuture !== bFuture) return aFuture ? -1 : 1;
      return aFuture ? aTime - bTime : bTime - aTime;
    });

  if (user && !isAdmin && !user.neighbourhoodId) {
    return <NoNeighbourhoodState message="Rejoins un quartier pour voir les événements" />;
  }

  return (
    <div className="flex flex-col h-full bg-creme">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="font-heading text-2xl font-bold text-charbon">Événements</h1>
        {user?.neighbourhoodId && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-vert-foret text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-vert-moyen transition-colors"
          >
            Soumettre
          </button>
        )}
      </div>

      {/* Date strip */}
      <div className="px-5 pb-3 overflow-x-auto scrollbar-none">
        <DateStrip selected={selectedDate} onSelect={setSelectedDate} />
      </div>

      {/* Recherche par nom / quartier */}
      <div className="px-5 pb-3 flex gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-xl border border-sable/50 bg-white px-3 py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-sable shrink-0">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAdmin ? 'Rechercher par nom ou quartier...' : 'Rechercher un événement...'}
            className="flex-1 bg-transparent text-sm text-charbon outline-none placeholder:text-sable min-w-0"
          />
        </div>
        {isAdmin && (
          <select
            value={neighbourhoodFilter}
            onChange={(e) => setNeighbourhoodFilter(e.target.value)}
            className="rounded-xl border border-sable/50 bg-white px-3 py-2 text-sm text-charbon outline-none focus:ring-2 focus:ring-vert-foret/30 max-w-[45%]"
          >
            <option value="all">Tous les quartiers</option>
            {neighbourhoods.map((n) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Status filters */}
      <div className="px-5 pb-3 flex gap-2">
        <button
          onClick={() => setStatusFilter(statusFilter === 'inscrit' ? 'all' : 'inscrit')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            statusFilter === 'inscrit'
              ? 'bg-vert-foret text-white border-vert-foret'
              : 'bg-white text-charbon/60 border-sable/50 hover:bg-sable/10'
          }`}
        >
          ✓ Inscrit
        </button>
        <button
          onClick={() => setStatusFilter(statusFilter === 'interesse' ? 'all' : 'interesse')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            statusFilter === 'interesse'
              ? 'bg-ambre text-white border-ambre'
              : 'bg-white text-charbon/60 border-sable/50 hover:bg-sable/10'
          }`}
        >
          ★ Intéressé
        </button>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-charbon/40">
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-charbon/40">
            <span className="text-5xl mb-4">📅</span>
            <p className="font-medium text-charbon/60">Aucun événement</p>
            <p className="text-sm mt-1">
              {selectedDate ? 'Aucun événement ce jour-là.' : 'Soyez le premier à en créer un !'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                userId={user?._id ?? ''}
                onRsvp={handleRsvp}
                onInterest={handleInterest}
                neighbourhoodName={isAdmin ? neighbourhoodNames.get(event.neighbourhoodId) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <CreateEventModal
          onClose={() => setShowModal(false)}
          onCreated={fetchEvents}
          userId={user?._id ?? ''}
          neighbourhoodId={user?.neighbourhoodId}
        />
      )}
    </div>
  );
}
