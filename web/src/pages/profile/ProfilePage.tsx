import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/useUser';
import api from '../../api/axios';
import type { components } from '../../api/types.generated';

type Announcement = components['schemas']['Announcement'];
type Neighbourhood = components['schemas']['Neighbourhood'];



function formatMemberSince(dateStr?: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [neighbourhood, setNeighbourhood] = useState<Neighbourhood | null>(null);

  useEffect(() => {
    if (!user?._id) return;
    api.get<Announcement[]>('/announcements')
      .then(({ data }) => setAnnouncements(data.filter((a) => a.authorId === String(user._id))))
      .catch(() => { });
  }, [user?._id]);

  useEffect(() => {
    if (!user?.neighbourhoodId) return;
    api.get<Neighbourhood>(`/neighbourhoods/${user.neighbourhoodId}`)
      .then(({ data }) => setNeighbourhood(data))
      .catch(() => { });
  }, [user?.neighbourhoodId]);

  if (!user) return null;

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  const memberSince = formatMemberSince(user.createdAt);

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Hero header ── */}
      <div className="relative h-28 lg:h-36 bg-vert-foret overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-vert-moyen/60 to-vert-foret/90" />
      </div>

      <div className="px-4 lg:px-8 -mt-10 lg:-mt-14 pb-6">

        {/* ── Identité ── */}
        <div className="flex items-end justify-between mb-3">
          <div className="relative">
            <div className="flex h-20 w-20 lg:h-24 lg:w-24 items-center justify-center rounded-full bg-ambre border-4 border-creme shadow-md">
              <span className="font-heading text-2xl lg:text-3xl font-bold text-white">{initials}</span>
            </div>
          </div>
        </div>

        <h1 className="font-heading text-2xl font-bold text-charbon">{user.firstName} {user.lastName}</h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
          {neighbourhood && (
            <span className="flex items-center gap-1 font-sans text-xs text-sable">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              {neighbourhood.name}
            </span>
          )}
          {memberSince && (
            <span className="flex items-center gap-1 font-sans text-xs text-sable">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Membre depuis {memberSince}
            </span>
          )}
        </div>

        {/* ── Carte points ── */}
        <div className="mt-5 rounded-2xl bg-ambre px-5 py-4 flex items-center justify-between">
          <div>
            <p className="font-sans text-xs text-white/70 mb-1">Solde de points</p>
            <p className="font-heading text-4xl font-bold text-white">{user.points}</p>
            <p className="font-sans text-xs text-white/70 mt-0.5">points disponibles</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1.5 font-sans text-xs font-semibold text-white text-center">{user.points}</span>
          </div>
        </div>

        {/* ── Grille services + historique ── */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Services */}
          <div className="rounded-2xl bg-white border border-sable/30 p-4">
            <h2 className="font-sans text-sm font-bold text-charbon mb-3">
              Mes services ({announcements.length})
            </h2>
            <div className="flex flex-col gap-2">
              {announcements.length === 0 ? (
                <p className="font-sans text-xs text-sable text-center py-4">Aucun service publié</p>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl bg-creme px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{a.type === 'offer' ? '🤝' : '🙋'}</span>
                      <div>
                        <p className="font-sans text-sm font-semibold text-charbon">{a.title}</p>
                        <p className="font-sans text-xs text-sable">{a.points} pts/h</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 font-sans text-xs font-semibold ${a.status === 'open' ? 'bg-[#E8F5EE] text-vert-moyen' :
                      a.status === 'accepted' ? 'bg-[#FFF8EE] text-ambre' :
                        'bg-sable/20 text-sable'
                      }`}>
                      {a.status === 'open' ? 'Actif' : a.status === 'accepted' ? 'En cours' : 'Terminé'}
                    </span>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => navigate('/services/new')}
              className="mt-3 w-full rounded-xl border border-dashed border-sable py-2.5 font-sans text-sm text-sable hover:border-vert-moyen hover:text-vert-moyen transition-colors"
            >
              + Ajouter un service
            </button>
          </div>

          {/* Historique des points */}
          <div className="rounded-2xl bg-white border border-sable/30 p-4">
            <h2 className="font-sans text-sm font-bold text-charbon mb-3">Historique des points</h2>
          </div>
        </div>

        {/* ── Paramètres ── */}
        <div className="mt-4 rounded-2xl bg-white border border-sable/30 overflow-hidden">
          {[
            { icon: '✏️', label: 'Modifier mon profil', sub: 'Nom, email, quartier, mot de passe', to: '/profile/edit' },
            { icon: '🛡️', label: 'Sécurité & MFA', sub: 'Mot de passe, authentification', to: null },
            { icon: '📄', label: 'Mes documents', sub: 'Contrats et accords', to: null },
            { icon: '⚙️', label: 'Paramètres', sub: 'Langue, notifications', to: null },
          ].map((item, i, arr) => (
            <button
              key={item.label}
              onClick={() => item.to && navigate(item.to)}
              className={`w-full flex items-center justify-between px-4 py-4 text-left hover:bg-creme transition-colors ${i < arr.length - 1 ? 'border-b border-sable/20' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="font-sans text-sm font-semibold text-charbon">{item.label}</p>
                  <p className="font-sans text-xs text-sable">{item.sub}</p>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-sable flex-shrink-0">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
