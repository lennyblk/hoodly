import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import type { components } from '../../api/types.generated';
import { useUser } from '../../contexts/useUser';

type Announcement = components['schemas']['Announcement'];
type Conversation = components['schemas']['Conversation'];
type User = components['schemas']['User'];

export default function ServiceDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api.get<Announcement>(`/announcements/${id}`)
      .then(({ data }) => {
        setAnnouncement(data);
        return api.get<User>(`/users/${data.authorId}`);
      })
      .then(({ data }) => setAuthor(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleContact() {
    if (!user?._id || !announcement?.authorId) return;
    setContacting(true);
    try {
      const { data } = await api.post<Conversation>('/conversations', {
        participants: [String(user._id), announcement.authorId],
      });
      navigate('/messages', { state: { conversationId: data.id } });
    } catch {
      setContacting(false);
    }
  }

  async function handleAccept() {
    if (!announcement || !user) return;
    navigate(`/services/${id}/contract`, {
      state: {
        announcementTitle: announcement.title,
        authorName: author ? `${author.firstName} ${author.lastName}` : 'Prestataire',
        acceptorName: `${user.firstName} ${user.lastName}`,
      },
    });
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="font-sans text-sable">Chargement du service...</p>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 p-8">
        <p className="font-sans text-charbon font-semibold">Service introuvable</p>
        <button onClick={() => navigate('/services')} className="text-vert-foret underline">
          Retour aux services
        </button>
      </div>
    );
  }

  const isOwner = String(user?._id) === announcement.authorId;
  const authorInitials = author
    ? `${author.firstName[0]}${author.lastName[0]}`.toUpperCase()
    : '?';

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Header vert ── */}
      <div className="bg-vert-foret px-4 lg:px-8 pt-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/services')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-sans text-xs font-medium text-white">
            📋 {announcement.type === 'offer' ? 'Offre' : 'Demande'}
          </span>
          {isOwner && (
            <span className="flex items-center gap-1.5 rounded-full bg-ambre px-3 py-1 font-sans text-xs font-medium text-white">
              Mon annonce
            </span>
          )}
        </div>

        <h1 className="font-heading text-3xl font-bold text-white mb-1">{announcement.title}</h1>
        <p className="font-sans text-sm text-white/70 mb-4">
          {announcement.type === 'offer' ? "Offre d'aide" : "Demande d'aide"}
        </p>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-ambre px-3 py-1.5 font-sans text-sm font-bold text-white">
            ★ {announcement.points} points
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 font-sans text-sm font-semibold text-white capitalize">
            {announcement.status}
          </span>
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="flex flex-col gap-4 px-4 lg:px-8 py-6 pb-8">

        {/* Carte auteur */}
        <div className="rounded-2xl bg-white border border-sable/40 p-5">
          <p className="font-sans text-xs text-sable uppercase tracking-wide mb-3">Proposé par</p>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-vert-foret font-sans text-lg font-bold text-white shrink-0">
              {authorInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-base font-bold text-charbon">
                {author ? `${author.firstName} ${author.lastName}` : `···${announcement.authorId.slice(-4)}`}
              </p>
              {author && (
                <p className="font-sans text-xs text-sable capitalize">{author.role}</p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="rounded-2xl bg-white border border-sable/40 p-5">
          <h3 className="font-sans text-sm font-bold text-charbon mb-2">Description & Détails</h3>
          <p className="font-sans text-sm text-sable leading-relaxed whitespace-pre-wrap">
            {announcement.description}
          </p>
        </div>

        {/* Notice contrat */}
        <div className="rounded-2xl bg-[#FFF8EE] border border-ambre/20 px-5 py-4 flex items-start gap-3">
          <span className="text-ambre mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <p className="font-sans text-xs text-charbon leading-relaxed">
            Un <span className="font-semibold">contrat de service</span> sera généré automatiquement et devra être signé numériquement par les deux parties.
          </p>
        </div>
      </div>

      {/* ── Boutons action ── */}
      <div className="sticky bottom-0 bg-white border-t border-sable/40 px-4 lg:px-8 py-4 flex gap-3">
        {isOwner ? (
          <div className="flex-1 flex items-center justify-center rounded-xl border border-sable/40 py-3 font-sans text-sm text-sable">
            En attente d'acceptation
          </div>
        ) : (
          <>
            <button
              onClick={handleContact}
              disabled={contacting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-vert-foret py-3 font-sans text-sm font-semibold text-vert-foret hover:bg-vert-foret hover:text-white transition-colors disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              {contacting ? 'En cours...' : 'Contacter'}
            </button>
            {announcement.status === 'open' && (
              <button
                onClick={handleAccept}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-vert-foret py-3 font-sans text-sm font-semibold text-white hover:bg-vert-moyen transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Accepter l'annonce
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
