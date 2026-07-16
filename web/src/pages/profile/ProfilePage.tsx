import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/useUser';
import api from '../../api/axios';
import type { components } from '../../api/types.generated';

const DELETE_CONFIRM_TEXT = 'SUPPRIMER';

type Announcement = components['schemas']['Announcement'];
type Neighbourhood = components['schemas']['Neighbourhood'];
type PointsTransaction = components['schemas']['PointsTransaction'];

function formatMemberSince(dateStr?: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function formatTransactionDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, clearUser } = useUser();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [neighbourhood, setNeighbourhood] = useState<Neighbourhood | null>(null);
  const [pointsHistory, setPointsHistory] = useState<PointsTransaction[]>([]);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!user?._id) return;
    api.get<PointsTransaction[]>('/users/me/points/history')
      .then(({ data }) => setPointsHistory(data))
      .catch(() => { });
  }, [user?._id]);

  async function handleExportData() {
    setExporting(true);
    setExportError(null);
    try {
      const { data } = await api.get('/users/me/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hoodly-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err?.response?.data?.message ?? "Erreur lors de l'export de vos données.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmInput !== DELETE_CONFIRM_TEXT) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete('/users/me');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      clearUser();
      navigate('/login', { replace: true });
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message ?? 'Erreur lors de la suppression du compte.');
      setDeleting(false);
    }
  }

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
                        <p className="font-sans text-xs text-sable">{a.points} pts</p>
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
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {pointsHistory.length === 0 ? (
                <p className="font-sans text-xs text-sable text-center py-4">Aucun mouvement de points</p>
              ) : (
                pointsHistory.map((t) => (
                  <div key={t._id} className="flex items-center justify-between rounded-xl bg-creme px-3 py-2.5">
                    <div>
                      <p className="font-sans text-sm font-medium text-charbon">{t.reason}</p>
                      <p className="font-sans text-xs text-sable">{formatTransactionDate(t.createdAt)}</p>
                    </div>
                    <span className={`font-sans text-sm font-bold ${t.amount >= 0 ? 'text-vert-moyen' : 'text-red-500'}`}>
                      {t.amount >= 0 ? '+' : ''}{t.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Paramètres ── */}
        <div className="mt-4 rounded-2xl bg-white border border-sable/30 overflow-hidden">
          {[
            { icon: '✏️', label: 'Modifier mon profil', sub: 'Nom, email, quartier, mot de passe', to: '/profile/edit' },
            { icon: '📄', label: 'Mes documents', sub: 'Contrats et accords', to: '/documents' },
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

        {/* ── RGPD ── */}
        <div className="mt-4 rounded-2xl bg-white border border-sable/30 p-4">
          <h2 className="font-sans text-sm font-bold text-charbon mb-1">Vie privée & RGPD</h2>
          <p className="font-sans text-xs text-sable mb-4">Gérez vos données personnelles</p>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="w-full flex items-center justify-between rounded-xl border border-sable/40 px-4 py-3 text-left hover:bg-creme transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">📥</span>
                <div>
                  <p className="font-sans text-sm font-semibold text-charbon">
                    {exporting ? 'Export en cours...' : 'Exporter mes données'}
                  </p>
                  <p className="font-sans text-xs text-sable">Télécharger toutes vos données au format JSON</p>
                </div>
              </div>
            </button>

            {exportError && (
              <p className="font-sans text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">{exportError}</p>
            )}

            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-between rounded-xl border border-red-200 px-4 py-3 text-left hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🗑️</span>
                <div>
                  <p className="font-sans text-sm font-semibold text-red-600">Supprimer mon compte</p>
                  <p className="font-sans text-xs text-sable">Suppression définitive de votre compte et données</p>
                </div>
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* ── Modal suppression compte ── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-charbon/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && !deleting && setShowDeleteModal(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6">
            <h2 className="font-heading text-lg font-bold text-charbon mb-2">Supprimer mon compte</h2>
            <p className="font-sans text-sm text-charbon/70 leading-relaxed mb-4">
              Cette action est <span className="font-semibold">définitive et irréversible</span>. Toutes vos données
              (profil, annonces, messages, documents) seront supprimées.
            </p>
            <p className="font-sans text-xs text-sable mb-1.5">
              Tapez <span className="font-semibold text-charbon">{DELETE_CONFIRM_TEXT}</span> pour confirmer :
            </p>
            <input
              type="text"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              className="w-full rounded-xl border border-sable px-4 py-2.5 font-sans text-sm text-charbon outline-none focus:border-red-400 mb-4"
              autoFocus
            />

            {deleteError && (
              <p className="font-sans text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl mb-4">{deleteError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmInput(''); setDeleteError(null); }}
                disabled={deleting}
                className="flex-1 rounded-xl border border-sable py-2.5 font-sans text-sm font-medium text-charbon hover:bg-creme transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmInput !== DELETE_CONFIRM_TEXT}
                className="flex-1 rounded-xl bg-red-600 py-2.5 font-sans text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-40"
              >
                {deleting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
