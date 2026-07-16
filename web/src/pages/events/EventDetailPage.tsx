import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useUser } from '../../contexts/useUser';
import { EVENT_EMOJI_CHOICES, getEventVisual } from '../../constants/eventVisuals';

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
  status?: 'active' | 'cancelled';
  emoji?: string;
  createdAt: string;
}

function EditEventModal({
  event,
  onClose,
  onSaved,
}: {
  event: Event;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: event.title,
    description: event.description,
    type: event.type as string,
    emoji: event.emoji ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

   const isStandardType = (t: string) => t === 'contract' || t === 'other';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload: { title: string; description: string; type?: string; emoji?: string } = {
        title: form.title,
        description: form.description,
        emoji: form.emoji, // '' = retour au visuel automatique
      };
      if (isStandardType(form.type)) payload.type = form.type;
      await api.patch(`/events/${event.id}`, payload);
      await onSaved();
      onClose();
    } catch {
      setError("Erreur lors de la modification de l'événement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-charbon/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-xl font-bold text-charbon">Modifier l'événement</h2>
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
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charbon/70 mb-1">Description</label>
            <textarea
              className="w-full border border-sable rounded-xl px-3 py-2.5 text-charbon text-sm focus:outline-none focus:ring-2 focus:ring-vert-foret/40 focus:border-vert-foret resize-none"
              rows={3}
              required
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charbon/70 mb-1">Type</label>
            <select
              className="w-full border border-sable rounded-xl px-3 py-2.5 text-charbon text-sm focus:outline-none focus:ring-2 focus:ring-vert-foret/40 focus:border-vert-foret bg-white"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              {!isStandardType(event.type as string) && (
                <option value={event.type}>{event.type} (catégorie actuelle)</option>
              )}
              <option value="other">Général</option>
              <option value="contract">Contractuel</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-charbon/70 mb-1">Emoji</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, emoji: '' }))}
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
                  onClick={() => setForm((f) => ({ ...f, emoji: em }))}
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

          <div>
            <label className="block text-sm font-medium text-charbon/70 mb-1">Date et heure</label>
            <input
              disabled
              value={`${formatFullDate(event.date)} · ${formatTime(event.date)}`}
              className="w-full border border-sable/40 bg-sable/10 rounded-xl px-3 py-2.5 text-charbon/50 text-sm capitalize"
            />
            <p className="text-xs text-charbon/40 mt-1">
              La date n'est pas modifiable. Pour changer la date, annulez cet événement et créez-en un nouveau.
            </p>
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
              disabled={saving}
              className="flex-1 bg-vert-foret text-white rounded-xl py-2.5 font-medium text-sm hover:bg-vert-moyen transition-colors disabled:opacity-50"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const AVATAR_COLORS = ['#1E4D35', '#E07B39', '#52B788', '#F4A261', '#2D6A4F', '#C8B89A'];

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
  const { user, fetchMe } = useUser();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [intLoading, setIntLoading] = useState(false);
  const [nameMap, setNameMap] = useState<Map<string, string>>(new Map());
  const [nameMapLoaded, setNameMapLoaded] = useState(false);
  const [leftUsers, setLeftUsers] = useState<Map<string, string>>(new Map());
  const [goneIds, setGoneIds] = useState<Set<string>>(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

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
    }).catch(() => {})
      .finally(() => setNameMapLoaded(true));
  }, [event?.neighbourhoodId]);

    useEffect(() => {
    if (!event || !nameMapLoaded) return;
    const missing = [...new Set(event.participants ?? [])].filter(
      (pid) => !nameMap.has(pid) && !leftUsers.has(pid) && !goneIds.has(pid),
    );
    if (missing.length === 0) return;
    Promise.all(
      missing.map((pid) =>
        api.get<{ _id: string; firstName: string; lastName: string }>(`/users/${pid}`)
          .then(({ data }) => ({ pid, name: `${data.firstName} ${data.lastName}` }))
          .catch(() => ({ pid, name: null as string | null })),
      ),
    ).then((results) => {
      setLeftUsers((prev) => {
        const next = new Map(prev);
        for (const r of results) if (r.name) next.set(r.pid, r.name);
        return next;
      });
      setGoneIds((prev) => {
        const next = new Set(prev);
        for (const r of results) if (!r.name) next.add(r.pid);
        return next;
      });
    });
  }, [event, nameMap, nameMapLoaded, leftUsers, goneIds]);

  async function handleRsvp() {
    if (!user || !event) return;
    setRsvpLoading(true);
    try {
      await api.post(`/events/${event.id}/rsvp`, { userId: user._id });
      await fetchEvent();
      fetchMe().catch(() => {});
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

  async function handleCancelEvent() {
    if (!event || cancelLoading) return;
    if (!window.confirm('Annuler cet événement ? Les participants ne pourront plus s\'y inscrire et cette action est définitive.')) return;
    setCancelLoading(true);
    try {
      await api.post(`/events/${event.id}/cancel`);
      await fetchEvent();
    } finally {
      setCancelLoading(false);
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

  // Comptes supprimés (introuvables côté API) : retirés de la liste affichée
  const visibleParticipants = (event.participants ?? []).filter((pid) => !goneIds.has(pid));

  const isParticipant = event.participants?.includes(user?._id ?? '');
  const isInterested = event.interestUsers?.includes(user?._id ?? '');
  const isPast = new Date(event.date) < new Date();
  const isCancelled = event.status === 'cancelled';
  const canManage =
    !!user &&
    (user._id === event.organizerId || user.role === 'moderateur' || user.role === 'admin');
  const { bg, emoji } = getEventVisual(event);

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
        {canManage && !isCancelled && !isPast && (
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
              onClick={() => setShowEditModal(true)}
              className="bg-white rounded-full px-3.5 h-9 flex items-center gap-1.5 text-sm font-medium text-charbon hover:bg-sable/20 transition-colors shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
              Modifier
            </button>
            <button
              onClick={handleCancelEvent}
              disabled={cancelLoading}
              className="bg-white rounded-full px-3.5 h-9 flex items-center gap-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors shadow-sm disabled:opacity-50"
            >
              {cancelLoading ? '...' : 'Annuler l\'événement'}
            </button>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center text-6xl select-none pointer-events-none">
          {emoji}
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-charbon drop-shadow-sm">
            {event.title}
          </h1>
          {isCancelled && (
            <span className="bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              Annulé
            </span>
          )}
        </div>
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

          {/* Participants — les comptes supprimés sont retirés, les partis du quartier signalés */}
          <section>
            <h2 className="font-heading font-semibold text-charbon mb-3">
              Participants ({visibleParticipants.length})
            </h2>
            {visibleParticipants.length === 0 ? (
              <p className="text-sm text-charbon/40 italic">Aucun participant pour l'instant.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {visibleParticipants.slice(0, 10).map((pid, i) => {
                  const hasLeft = !nameMap.has(pid) && leftUsers.has(pid);
                  const name = nameMap.get(pid) ?? leftUsers.get(pid) ?? '…';
                  return hasLeft ? (
                    <div
                      key={pid}
                      className="h-8 rounded-full flex items-center gap-1.5 bg-sable/30 text-charbon/50 text-xs font-bold px-3"
                      title="Cet utilisateur ne fait plus partie du quartier"
                    >
                      <span className="line-through decoration-charbon/30">{name}</span>
                      <span className="font-medium italic">· parti du quartier</span>
                    </div>
                  ) : (
                    <div
                      key={pid}
                      className="h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm px-3"
                      style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                    >
                      {name}
                    </div>
                  );
                })}
                {visibleParticipants.length > 10 && (
                  <div className="h-8 rounded-full bg-sable/30 flex items-center justify-center text-charbon/60 text-xs font-bold px-3">
                    +{visibleParticipants.length - 10}
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
        {isCancelled ? (
          <div className="flex-1 py-3 rounded-xl text-sm font-medium text-center bg-red-50 text-red-600 border border-red-200">
            Cet événement a été annulé
          </div>
        ) : isPast ? (
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

      {showEditModal && (
        <EditEventModal
          event={event}
          onClose={() => setShowEditModal(false)}
          onSaved={fetchEvent}
        />
      )}
    </div>
  );
}
