import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { useUser } from '../../contexts/useUser';
import NoNeighbourhoodState from '../../components/NoNeighbourhoodState';

type VoteType = 'yesno' | 'multiple';

interface VoteResult {
  option: string;
  userIds: string[];
}

interface Vote {
  id: string;
  question: string;
  type: VoteType;
  options: string[];
  isAnonymous: boolean;
  endsAt: string;
  neighbourhoodId: string;
  results: VoteResult[];
  createdAt: string;
}

function isExpired(endsAt: string) {
  return new Date() > new Date(endsAt);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getTotalVotes(results: VoteResult[]) {
  return results.reduce((acc, r) => acc + (r.userIds?.length ?? 0), 0);
}

function hasVoted(results: VoteResult[], userId: string) {
  return results.some((r) => r.userIds?.some((uid) => uid === userId || uid.toString() === userId));
}

function getUserOption(results: VoteResult[], userId: string) {
  return results.find((r) => r.userIds?.some((uid) => uid === userId || uid.toString() === userId))?.option ?? null;
}

interface VoteCardProps {
  vote: Vote;
  currentUserId: string;
  onVoted: (updated: Vote) => void;
  canDelete: boolean;
  onDelete: (id: string) => void;
  canManage: boolean;
}

function VoteCard({ vote, currentUserId, onVoted, canDelete, onDelete, canManage }: VoteCardProps) {
  const navigate = useNavigate();
  const [casting, setCasting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expired = isExpired(vote.endsAt);
  const voted = hasVoted(vote.results, currentUserId);
  const userOption = getUserOption(vote.results, currentUserId);
  const showResults = voted || expired || canManage;
  const total = getTotalVotes(vote.results);

  async function castVote(option: string) {
    if (casting || expired || option === userOption) return;
    setCasting(true);
    setError(null);
    try {
      const { data } = await api.post<Vote>(`/votes/${vote.id}/cast`, {
        userId: currentUserId,
        option,
      });
      onVoted(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erreur lors du vote');
    } finally {
      setCasting(false);
    }
  }

  return (
    <div
      onClick={() => navigate(`/votes/${vote.id}`)}
      className="bg-white rounded-2xl border border-sable/20 shadow-sm overflow-hidden cursor-pointer hover:border-vert-foret/30 hover:shadow-md transition-all"
    >
      <div className="px-5 pt-5 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className="font-heading font-semibold text-charbon text-base leading-snug flex-1">
            {vote.question}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {expired ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-sable/20 text-charbon/50">
                Terminé
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-vert-clair/15 text-vert-foret">
                En cours
              </span>
            )}
            {vote.isAnonymous && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-ambre/10 text-ambre">
                Anonyme
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-charbon/40 mb-4">
          Clôture le {formatDate(vote.endsAt)} · {total} vote{total !== 1 ? 's' : ''}
        </p>

        {/* Options */}
        <div className="space-y-2">
          {vote.options.map((option) => {
            const result = vote.results.find((r) => r.option === option);
            const count = result?.userIds?.length ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const isChosen = userOption === option;

            if (showResults) {
              const clickable = !expired && !isChosen && !casting && !canManage;
              const canClick = !expired && !isChosen && !casting;
              return (
                <div
                  key={option}
                  onClick={(e) => { e.stopPropagation(); canClick && !canManage && castVote(option); }}
                  className={`rounded-xl px-4 py-2.5 transition-colors ${
                    isChosen
                      ? 'bg-vert-clair/10 border border-vert-foret/30'
                      : clickable
                      ? 'border border-sable hover:border-vert-foret hover:bg-vert-clair/5 cursor-pointer'
                      : 'border border-sable/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm ${isChosen ? 'font-semibold text-vert-foret' : 'text-charbon/70'}`}>
                      {option}
                      {isChosen && <span className="ml-1.5 text-xs">✓</span>}
                    </span>
                    <span className="text-xs text-charbon/50">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-sable/20 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isChosen ? 'bg-vert-foret' : 'bg-sable/50'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            }

            return (
              <button
                key={option}
                onClick={(e) => { e.stopPropagation(); castVote(option); }}
                disabled={casting}
                className="w-full text-left px-4 py-2.5 rounded-xl border border-sable text-sm text-charbon/80 hover:border-vert-foret hover:text-vert-foret hover:bg-vert-clair/5 transition-colors disabled:opacity-50"
              >
                {option}
              </button>
            );
          })}
        </div>

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      {canDelete && (
        <div className="px-5 pb-4">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(vote.id); }}
            className="text-xs text-charbon/30 hover:text-red-400 transition-colors"
          >
            Supprimer ce sondage
          </button>
        </div>
      )}
    </div>
  );
}

interface Neighbourhood { _id: string; name: string; }

interface CreateModalProps {
  neighbourhoodId?: string;
  onCreated: (vote: Vote) => void;
  onClose: () => void;
}

function CreateModal({ neighbourhoodId: defaultNid, onCreated, onClose }: CreateModalProps) {
  const isAdminMode = !defaultNid;
  const [selectedNid, setSelectedNid] = useState('');
  const [neighbourhoods, setNeighbourhoods] = useState<Neighbourhood[]>([]);

  useEffect(() => {
    if (isAdminMode) {
      api.get<Neighbourhood[]>('/neighbourhoods').then(({ data }) => {
        setNeighbourhoods(data);
        if (data.length > 0) setSelectedNid(data[0]._id);
      }).catch(() => {});
    }
  }, [isAdminMode]);

  const neighbourhoodId = defaultNid ?? selectedNid;
  const [question, setQuestion] = useState('');
  const [type, setType] = useState<VoteType>('yesno');
  const [options, setOptions] = useState(['Option A', 'Option B']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [endsAt, setEndsAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTypeChange(t: VoteType) {
    setType(t);
    if (t === 'yesno') setOptions(['Pour', 'Contre']);
    else setOptions(['Option A', 'Option B']);
  }

  function updateOption(i: number, val: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)));
  }

  function addOption() {
    if (options.length < 6) setOptions((prev) => [...prev, '']);
  }

  function removeOption(i: number) {
    if (options.length > 2) setOptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!question.trim() || !endsAt || options.some((o) => !o.trim())) return;
    setSubmitting(true);
    setError(null);
    try {
      const finalOptions = type === 'yesno' ? ['Pour', 'Contre'] : options.map((o) => o.trim());
      const { data } = await api.post<Vote>('/votes', {
        question: question.trim(),
        type,
        options: finalOptions,
        isAnonymous,
        endsAt: new Date(endsAt).toISOString(),
        neighbourhoodId,
      });
      onCreated(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  }

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 16);

  return (
    <div
      className="fixed inset-0 bg-charbon/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-sable/20">
          <h2 className="font-heading text-lg font-bold text-charbon">Nouveau sondage</h2>
          <button onClick={onClose} className="text-charbon/40 hover:text-charbon text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Quartier — admin only */}
          {isAdminMode && (
            <div>
              <label className="text-xs font-medium text-charbon/60 mb-1.5 block">Quartier *</label>
              <select
                value={selectedNid}
                onChange={(e) => setSelectedNid(e.target.value)}
                required
                className="w-full border border-sable/40 rounded-xl px-3 py-2.5 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/30"
              >
                {neighbourhoods.map((n) => (
                  <option key={n._id} value={n._id}>{n.name}</option>
                ))}
              </select>
            </div>
          )}
          {/* Question */}
          <div>
            <label className="text-xs font-medium text-charbon/60 mb-1.5 block">Question *</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Faut-il installer des bancs dans le parc ?"
              className="w-full border border-sable rounded-xl px-4 py-2.5 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/40 focus:border-vert-foret resize-none"
              rows={2}
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-medium text-charbon/60 mb-1.5 block">Type</label>
            <div className="flex gap-2">
              {(['yesno', 'multiple'] as VoteType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`flex-1 py-2 rounded-xl text-sm border transition-colors ${
                    type === t
                      ? 'bg-vert-foret text-white border-vert-foret'
                      : 'border-sable text-charbon/60 hover:border-vert-foret'
                  }`}
                >
                  {t === 'yesno' ? 'Oui / Non' : 'Choix multiple'}
                </button>
              ))}
            </div>
          </div>

          {/* Options (only for multiple) */}
          {type === 'multiple' && (
            <div>
              <label className="text-xs font-medium text-charbon/60 mb-1.5 block">Options *</label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 border border-sable rounded-xl px-4 py-2 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/40 focus:border-vert-foret"
                      required
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        className="text-charbon/30 hover:text-red-400 px-2"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="text-xs text-vert-foret hover:underline"
                  >
                    + Ajouter une option
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Date de clôture */}
          <div>
            <label className="text-xs font-medium text-charbon/60 mb-1.5 block">Date de clôture *</label>
            <input
              type="datetime-local"
              value={endsAt}
              min={minDateStr}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full border border-sable rounded-xl px-4 py-2.5 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/40 focus:border-vert-foret"
              required
            />
          </div>

          {/* Anonyme toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setIsAnonymous((v) => !v)}
              className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${isAnonymous ? 'bg-vert-foret' : 'bg-sable/40'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isAnonymous ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-charbon/70">Votes anonymes</span>
          </label>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-vert-foret text-white py-3 rounded-xl text-sm font-medium hover:bg-vert-moyen transition-colors disabled:opacity-50"
          >
            {submitting ? 'Création...' : 'Créer le sondage'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function VotesPage() {
  const { user } = useUser();
  const location = useLocation();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all');

  const canManage = user?.role === 'moderateur' || user?.role === 'admin';

  useEffect(() => {
    if (canManage && (location.state as { openCreate?: boolean } | null)?.openCreate) {
      setShowModal(true);
    }
  }, [location.state, canManage]);

  const isAdmin = user?.role === 'admin';

  const fetchVotes = useCallback(async () => {
    if (!isAdmin && !user?.neighbourhoodId) {
      setLoading(false);
      return;
    }
    try {
      const url = isAdmin ? '/votes' : `/votes?neighbourhoodId=${user!.neighbourhoodId}`;
      const { data } = await api.get<Vote[]>(url);
      setVotes(data);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  function handleVoted(updated: Vote) {
    setVotes((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  }

  function handleCreated(vote: Vote) {
    setVotes((prev) => [vote, ...prev]);
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce sondage ?')) return;
    try {
      await api.delete(`/votes/${id}`);
      setVotes((prev) => prev.filter((v) => v.id !== id));
    } catch {
      alert('Erreur lors de la suppression');
    }
  }

  const filtered = votes.filter((v) => {
    if (filter === 'active') return !isExpired(v.endsAt);
    if (filter === 'ended') return isExpired(v.endsAt);
    return true;
  });

  if (user && !isAdmin && !user.neighbourhoodId) {
    return <NoNeighbourhoodState message="Rejoins un quartier pour voir les sondages" />;
  }

  return (
    <div className="flex flex-col h-full bg-creme">
      {/* Header */}
      <div className="px-5 lg:px-8 pt-6 pb-4 bg-white border-b border-sable/20 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-heading text-2xl font-bold text-charbon">Sondages</h1>
          {canManage && !isAdmin && !!user?.neighbourhoodId && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-vert-foret text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-vert-moyen transition-colors flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Nouveau sondage
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          {([['all', 'Tous'], ['active', 'En cours'], ['ended', 'Terminés']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === val
                  ? 'bg-vert-foret text-white'
                  : 'bg-sable/20 text-charbon/60 hover:bg-sable/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 lg:px-8 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-charbon/40 text-sm">
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl mb-3">🗳️</span>
            <p className="text-charbon/60 font-medium">
              {filter === 'all'
                ? 'Aucun sondage dans ce quartier'
                : filter === 'active'
                ? 'Aucun sondage en cours'
                : 'Aucun sondage terminé'}
            </p>
            {canManage && filter === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 text-sm text-vert-foret font-medium hover:underline"
              >
                Créer le premier sondage
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl">
            {filtered.map((vote) => (
              <VoteCard
                key={vote.id}
                vote={vote}
                currentUserId={user!._id}
                onVoted={handleVoted}
                canDelete={canManage}
                onDelete={handleDelete}
                canManage={canManage}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && !isAdmin && user?.neighbourhoodId && (
        <CreateModal
          neighbourhoodId={user?.neighbourhoodId}
          onCreated={handleCreated}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
