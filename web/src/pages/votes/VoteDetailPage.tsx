import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useUser } from '../../contexts/useUser';

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
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

interface Neighbour {
  _id: string;
  firstName: string;
  lastName: string;
}

export default function VoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [vote, setVote] = useState<Vote | null>(null);
  const [neighbours, setNeighbours] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [casting, setCasting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = user?.role === 'moderateur' || user?.role === 'admin';

  useEffect(() => {
    if (!id) return;
    api.get<Vote>(`/votes/${id}`)
      .then(({ data }) => {
        setVote(data);
        if (!data.isAnonymous && data.neighbourhoodId) {
          return api.get<Neighbour[]>(`/users/neighbourhood?neighbourhoodId=${data.neighbourhoodId}`)
            .then(({ data: users }) => {
              const map = new Map<string, string>();
              users.forEach((u) => map.set(u._id, `${u.firstName} ${u.lastName}`));
              setNeighbours(map);
            })
            .catch(() => {});
        }
      })
      .catch(() => navigate('/votes', { replace: true }))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  async function castVote(option: string) {
    if (!vote || !user || casting) return;
    const expired = isExpired(vote.endsAt);
    if (expired) return;
    const userOption = getUserOption(vote.results, user._id);
    if (option === userOption) return;

    setCasting(true);
    setError(null);
    try {
      const { data } = await api.post<Vote>(`/votes/${vote.id}/cast`, {
        userId: user._id,
        option,
      });
      setVote(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erreur lors du vote');
    } finally {
      setCasting(false);
    }
  }

  async function handleDelete() {
    if (!vote || !confirm('Supprimer ce sondage ?')) return;
    try {
      await api.delete(`/votes/${vote.id}`);
      navigate('/votes', { replace: true });
    } catch {
      alert('Erreur lors de la suppression');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-creme">
        <p className="text-charbon/40 text-sm">Chargement...</p>
      </div>
    );
  }

  if (!vote) return null;

  const expired = isExpired(vote.endsAt);
  const voted = hasVoted(vote.results, user!._id);
  const userOption = getUserOption(vote.results, user!._id);
  const showResults = voted || expired || canManage;
  const total = getTotalVotes(vote.results);

  return (
    <div className="flex flex-col h-full bg-creme">
      {/* Header */}
      <div className="px-5 lg:px-8 pt-6 pb-4 bg-white border-b border-sable/20 flex-shrink-0">
        <button
          onClick={() => navigate('/votes')}
          className="flex items-center gap-2 text-sm text-charbon/50 hover:text-charbon mb-4 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Retour aux sondages
        </button>

        <div className="flex items-start justify-between gap-3">
          <h1 className="font-heading text-xl font-bold text-charbon leading-snug flex-1">
            {vote.question}
          </h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            {expired ? (
              <span className="text-xs px-2 py-1 rounded-full bg-sable/20 text-charbon/50">Terminé</span>
            ) : (
              <span className="text-xs px-2 py-1 rounded-full bg-vert-clair/15 text-vert-foret">En cours</span>
            )}
            {vote.isAnonymous && (
              <span className="text-xs px-2 py-1 rounded-full bg-ambre/10 text-ambre">Anonyme</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 lg:px-8 py-6">
        <div className="max-w-xl space-y-6">
          {/* Meta */}
          <div className="bg-white rounded-2xl border border-sable/20 shadow-sm px-5 py-4 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-charbon/50">Participants</span>
              <span className="font-medium text-charbon">{total} vote{total !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-charbon/50">Clôture</span>
              <span className="font-medium text-charbon">{formatDate(vote.endsAt)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-charbon/50">Type</span>
              <span className="font-medium text-charbon capitalize">{vote.type === 'yesno' ? 'Oui / Non' : 'Choix multiple'}</span>
            </div>
          </div>

          {/* Options / Results */}
          <div className="bg-white rounded-2xl border border-sable/20 shadow-sm px-5 py-5">
            <h2 className="font-heading font-semibold text-charbon text-sm mb-4">
              {showResults ? 'Résultats' : 'Vos choix'}
            </h2>
            <div className="space-y-3">
              {vote.options.map((option) => {
                const result = vote.results.find((r) => r.option === option);
                const count = result?.userIds?.length ?? 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const isChosen = userOption === option;

                if (showResults) {
                  const canClick = !expired && !isChosen && !casting;
                  return (
                    <div
                      key={option}
                      onClick={() => canClick && castVote(option)}
                      className={`rounded-xl px-4 py-3 transition-colors ${
                        isChosen
                          ? 'bg-vert-clair/10 border border-vert-foret/30'
                          : canClick
                          ? 'border border-sable hover:border-vert-foret hover:bg-vert-clair/5 cursor-pointer'
                          : 'border border-sable/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${isChosen ? 'text-vert-foret' : 'text-charbon/80'}`}>
                          {option}
                          {isChosen && <span className="ml-1.5 text-xs">✓</span>}
                        </span>
                        <div className="flex items-center gap-2">
                          {!vote.isAnonymous && (
                            <span className="text-xs text-charbon/40">{count} vote{count !== 1 ? 's' : ''}</span>
                          )}
                          <span className="text-sm font-semibold text-charbon/70">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-sable/20 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${isChosen ? 'bg-vert-foret' : 'bg-sable/60'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={option}
                    onClick={() => castVote(option)}
                    disabled={casting}
                    className="w-full text-left px-4 py-3 rounded-xl border border-sable text-sm text-charbon/80 hover:border-vert-foret hover:text-vert-foret hover:bg-vert-clair/5 transition-colors disabled:opacity-50"
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

            {!showResults && (
              <p className="text-xs text-charbon/40 mt-3">
                Les résultats s'affichent après avoir voté.
              </p>
            )}

            {canManage && !expired && (
              <p className="text-xs text-charbon/40 mt-3">
                En tant que modérateur, vous voyez les résultats en temps réel.
              </p>
            )}
          </div>

          {/* Participants (non-anonymous only) */}
          {!vote.isAnonymous && showResults && total > 0 && (
            <div className="bg-white rounded-2xl border border-sable/20 shadow-sm px-5 py-5">
              <h2 className="font-heading font-semibold text-charbon text-sm mb-4">Participants</h2>
              <div className="space-y-4">
                {vote.options.map((option) => {
                  const result = vote.results.find((r) => r.option === option);
                  const voters = result?.userIds ?? [];
                  if (voters.length === 0) return null;
                  return (
                    <div key={option}>
                      <p className="text-xs font-semibold text-charbon/50 uppercase tracking-wide mb-2">
                        {option} · {voters.length}
                      </p>
                      <div className="space-y-1">
                        {voters.map((uid) => {
                          const name = neighbours.get(uid.toString()) ?? uid.toString().slice(0, 8) + '…';
                          const isMe = uid.toString() === user!._id;
                          return (
                            <div key={uid.toString()} className="flex items-center gap-2">
                              <span className={`text-sm ${isMe ? 'text-vert-foret font-medium' : 'text-charbon/70'}`}>
                                {name}{isMe && ' (vous)'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Delete (moderator/admin only) */}
          {canManage && (
            <button
              onClick={handleDelete}
              className="text-xs text-charbon/30 hover:text-red-400 transition-colors"
            >
              Supprimer ce sondage
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
