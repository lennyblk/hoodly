import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import type { components } from '../../api/types.generated';
import { queryLangApi, type HqlDocument, type QueryLangResult } from '../../api/queryLang';
import { useUser } from '../../contexts/useUser';
import { HOODLY_INCIDENT_TARGET } from '../../constants/incidents';

type User = components['schemas']['User'];
type Neighbourhood = components['schemas']['Neighbourhood'];
type UserRole = 'habitant' | 'moderateur' | 'admin';

const ROLE_LABELS: Record<UserRole, string> = {
  habitant: 'Habitant',
  moderateur: 'Modérateur',
  admin: 'Admin',
};

const ROLE_COLORS: Record<UserRole, string> = {
  habitant: 'bg-sable/30 text-charbon/70',
  moderateur: 'bg-ambre/10 text-ambre',
  admin: 'bg-vert-foret/10 text-vert-foret',
};

// ─── Incidents ────────────────────────────────────────────────────────────────

type IncidentStatus = 'open' | 'resolved';

interface Incident {
  id: string;
  title: string;
  description: string;
  category: string;
  status: IncidentStatus;
  reportedBy: string;
  neighborhoodId: string;
  reportedAt: string;
}

function formatIncidentDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function IncidentsConsole({ neighbourhoods }: { neighbourhoods: Neighbourhood[] }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    api.get<Incident[]>('/incidents')
      .then(({ data }) => setIncidents(data))
      .finally(() => setLoading(false));
  }, []);

  async function toggleStatus(incident: Incident) {
    setUpdating(incident.id);
    try {
      const nextStatus: IncidentStatus = incident.status === 'open' ? 'resolved' : 'open';
      const { data } = await api.patch<Incident>(`/incidents/${incident.id}`, { status: nextStatus });
      setIncidents((prev) => prev.map((i) => (i.id === incident.id ? data : i)));
      setSelectedIncident((prev) => (prev?.id === incident.id ? data : prev));
    } finally {
      setUpdating(null);
    }
  }

  const neighbourhoodName = (id: string) =>
    id === HOODLY_INCIDENT_TARGET
      ? '🛟 Hoodly (direct)'
      : neighbourhoods.find((n) => String(n.id) === id)?.name ?? '—';

  const filtered = incidents.filter((i) => {
    if (filter === 'open') return i.status === 'open';
    if (filter === 'resolved') return i.status === 'resolved';
    return true;
  });

  return (
    <>
      <div className="flex items-center gap-3">
        {([['all', 'Tous'], ['open', 'Ouverts'], ['resolved', 'Résolus']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === val ? 'bg-vert-foret text-white' : 'bg-sable/20 text-charbon/60 hover:bg-sable/40'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="text-xs text-charbon/40">{filtered.length} incident{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="text-sm text-charbon/40">Chargement...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sable/30 max-h-[50vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-creme border-b border-sable/30">
                <th className="text-left px-5 py-3.5 font-semibold text-charbon/70 text-xs">Titre</th>
                <th className="text-left px-5 py-3.5 font-semibold text-charbon/70 text-xs">Catégorie</th>
                <th className="text-left px-5 py-3.5 font-semibold text-charbon/70 text-xs">Quartier</th>
                <th className="text-left px-5 py-3.5 font-semibold text-charbon/70 text-xs">Signalé le</th>
                <th className="text-left px-5 py-3.5 font-semibold text-charbon/70 text-xs">Statut</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr
                  key={i.id}
                  onClick={() => setSelectedIncident(i)}
                  className="border-b border-sable/20 last:border-0 hover:bg-creme/40 transition-colors align-top cursor-pointer"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-charbon">{i.title}</p>
                    <p className="text-xs text-charbon/50 mt-0.5 max-w-md">{i.description}</p>
                  </td>
                  <td className="px-5 py-3.5 text-charbon/60">{i.category}</td>
                  <td className="px-5 py-3.5 text-charbon/60">{neighbourhoodName(i.neighborhoodId)}</td>
                  <td className="px-5 py-3.5 text-charbon/60">{formatIncidentDate(i.reportedAt)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      i.status === 'open' ? 'bg-ambre/10 text-ambre' : 'bg-vert-clair/15 text-vert-foret'
                    }`}>
                      {i.status === 'open' ? 'Ouvert' : 'Résolu'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      disabled={updating === i.id}
                      onClick={() => toggleStatus(i)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium border border-vert-foret/20 text-vert-foret hover:bg-vert-foret/5 transition-colors disabled:opacity-40"
                    >
                      {updating === i.id ? '...' : i.status === 'open' ? 'Marquer résolu' : 'Rouvrir'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-sm text-charbon/40 py-8">Aucun incident trouvé</p>
          )}
        </div>
      )}

      {selectedIncident && (
        <IncidentPanel
          incident={selectedIncident}
          neighbourhoodLabel={neighbourhoodName(selectedIncident.neighborhoodId)}
          updating={updating === selectedIncident.id}
          onToggleStatus={() => toggleStatus(selectedIncident)}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </>
  );
}

interface IncidentPanelProps {
  incident: Incident;
  neighbourhoodLabel: string;
  updating: boolean;
  onToggleStatus: () => void;
  onClose: () => void;
}

function IncidentPanel({ incident, neighbourhoodLabel, updating, onToggleStatus, onClose }: IncidentPanelProps) {
  const navigate = useNavigate();
  const { user } = useUser();
  const [reporter, setReporter] = useState<User | null>(null);
  const [loadingReporter, setLoadingReporter] = useState(true);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    setLoadingReporter(true);
    api.get<User>(`/users/${incident.reportedBy}`)
      .then(({ data }) => setReporter(data))
      .catch(() => setReporter(null))
      .finally(() => setLoadingReporter(false));
  }, [incident.reportedBy]);

  async function handleContact() {
    if (!user?._id) return;
    setContacting(true);
    try {
      const { data } = await api.post<{ id: string }>('/conversations', {
        participants: [String(user._id), incident.reportedBy],
      });
      navigate('/messages', { state: { conversationId: data.id } });
    } finally {
      setContacting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-charbon/40 backdrop-blur-sm z-40" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-5 border-b border-sable/30">
            <div>
              <h2 className="font-heading text-lg font-bold text-charbon">{incident.title}</h2>
              <p className="text-xs text-charbon/40 mt-0.5">{incident.category} · {neighbourhoodLabel}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sable/30 text-charbon/50 transition-colors shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-3 bg-creme border-b border-sable/20 flex gap-4">
            <div className="text-center">
              <p className="text-xs text-charbon/40">Signalé le</p>
              <p className="font-semibold text-charbon text-xs">{formatIncidentDate(incident.reportedAt)}</p>
            </div>
            <div className="w-px bg-sable/30" />
            <div className="text-center">
              <p className="text-xs text-charbon/40">Statut</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                incident.status === 'open' ? 'bg-ambre/10 text-ambre' : 'bg-vert-clair/15 text-vert-foret'
              }`}>
                {incident.status === 'open' ? 'Ouvert' : 'Résolu'}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
            <div>
              <h3 className="text-xs font-semibold text-charbon/60 mb-1.5">Description</h3>
              <p className="text-sm text-charbon/80 leading-relaxed whitespace-pre-wrap">{incident.description}</p>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-charbon/60 mb-1.5">Signalé par</h3>
              {loadingReporter ? (
                <p className="text-sm text-charbon/40">Chargement...</p>
              ) : reporter ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-sable/30 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-charbon truncate">{reporter.firstName} {reporter.lastName}</p>
                    <p className="text-xs text-charbon/50 truncate">{reporter.email}</p>
                  </div>
                  <button
                    onClick={handleContact}
                    disabled={contacting}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium border border-vert-foret/20 text-vert-foret hover:bg-vert-foret/5 transition-colors disabled:opacity-40"
                  >
                    {contacting ? '...' : 'Contacter'}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-charbon/40">Utilisateur introuvable</p>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-sable/20 flex justify-end">
            <button
              disabled={updating}
              onClick={onToggleStatus}
              className="text-sm px-4 py-2 rounded-xl font-medium border border-vert-foret/20 text-vert-foret hover:bg-vert-foret/5 transition-colors disabled:opacity-40"
            >
              {updating ? '...' : incident.status === 'open' ? 'Marquer résolu' : 'Rouvrir'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── HQL Console ─────────────────────────────────────────────────────────────

const EXAMPLE_QUERIES = [
  'FIND documents WHERE status = "signed" AND type = "contract" LIMIT 10',
  'FIND documents WHERE (status = "pending" OR status = "draft") AND title CONTAINS "contrat"',
  'FIND documents WHERE ownerId = "64a1f2c3e4b5f6a7b8c9d0e2"',
  'FIND documents LIMIT 5',
];

const DOC_STATUS_LABELS: Record<HqlDocument['status'], string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  signed: 'Signé',
  archived: 'Archivé',
  refused: 'Refusé',
};

const DOC_STATUS_COLORS: Record<HqlDocument['status'], string> = {
  draft: 'bg-sable/30 text-charbon/60',
  pending: 'bg-ambre/10 text-ambre',
  signed: 'bg-vert-foret/10 text-vert-foret',
  archived: 'bg-sable/50 text-charbon/50',
  refused: 'bg-red-100 text-red-600',
};

function QueryConsole() {
  const [query, setQuery] = useState(EXAMPLE_QUERIES[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryLangResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'table' | 'json'>('table');
  const [fileBusy, setFileBusy] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);

  async function runQuery() {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setFileError(null);
    try {
      const { data } = await queryLangApi.execute(query);
      setResult(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erreur lors de l\'exécution de la requête');
    } finally {
      setLoading(false);
    }
  }

  async function fetchFile(doc: HqlDocument): Promise<string | null> {
    setFileBusy(doc.id);
    setFileError(null);
    try {
      const { data } = await queryLangApi.getDocumentFile(doc.id);
      return URL.createObjectURL(data);
    } catch {
      setFileError(`Impossible de récupérer le fichier de « ${doc.title} »`);
      return null;
    } finally {
      setFileBusy(null);
    }
  }

  async function viewDoc(doc: HqlDocument) {
    const url = await fetchFile(doc);
    if (url) setPreview({ url, title: doc.title });
  }

  async function downloadDoc(doc: HqlDocument) {
    const url = await fetchFile(doc);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name || `${doc.title}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function closePreview() {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      runQuery();
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-sable/20 shadow-sm p-5 lg:p-6 max-w-3xl">
      <h2 className="font-heading text-lg font-bold text-charbon mb-1">Console HQL</h2>
      <p className="text-sm text-charbon/50 mb-4">
        Syntaxe :{' '}
        <code className="bg-creme px-1.5 py-0.5 rounded text-xs">
          FIND documents [WHERE &lt;condition&gt;] [LIMIT &lt;n&gt;]
        </code>
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {EXAMPLE_QUERIES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setQuery(example)}
            className="text-xs px-2.5 py-1 rounded-full bg-sable/20 text-charbon/60 hover:bg-sable/40 transition-colors"
          >
            {example.split(' WHERE')[0]}
          </button>
        ))}
      </div>

      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        spellCheck={false}
        placeholder='FIND documents WHERE status = "signed" LIMIT 10'
        className="w-full font-mono text-sm border border-sable rounded-xl px-4 py-3 text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/40 focus:border-vert-foret resize-y"
      />

      <div className="flex items-center justify-between mt-3 mb-4">
        <span className="text-xs text-charbon/30">Ctrl/Cmd + Entrée pour exécuter</span>
        <button
          type="button"
          onClick={runQuery}
          disabled={loading || !query.trim()}
          className="bg-vert-foret text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-vert-moyen transition-colors disabled:opacity-50"
        >
          {loading ? 'Exécution...' : 'Exécuter'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {result && (
        <div>
          <div className="flex items-center gap-3 text-xs text-charbon/50 mb-2">
            <span className="font-medium text-vert-foret">{result.collection}</span>
            <span>{result.count} résultat{result.count !== 1 ? 's' : ''}</span>
            <span>{result.tookMs} ms</span>
            <div className="ml-auto flex rounded-lg overflow-hidden border border-sable/40">
              {(['table', 'json'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                    view === v ? 'bg-vert-foret text-white' : 'bg-white text-charbon/50 hover:bg-creme'
                  }`}
                >
                  {v === 'table' ? 'Tableau' : 'JSON'}
                </button>
              ))}
            </div>
          </div>

          {fileError && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl mb-2">{fileError}</p>
          )}

          {view === 'json' ? (
            <pre className="bg-charbon text-vert-clair text-xs rounded-xl p-4 overflow-auto max-h-96">
              {JSON.stringify(result.results, null, 2)}
            </pre>
          ) : result.results.length === 0 ? (
            <p className="text-center text-sm text-charbon/40 py-6 border border-sable/30 rounded-xl">
              Aucun document
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-sable/30 max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-creme border-b border-sable/30">
                    <th className="text-left px-4 py-3 font-semibold text-charbon/70 text-xs">Titre</th>
                    <th className="text-left px-4 py-3 font-semibold text-charbon/70 text-xs">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-charbon/70 text-xs">Statut</th>
                    <th className="text-left px-4 py-3 font-semibold text-charbon/70 text-xs">Créé le</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((doc) => (
                    <tr key={doc.id} className="border-b border-sable/20 last:border-0 hover:bg-creme/40 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-charbon">{doc.title}</span>
                        <p className="text-xs text-charbon/40">{doc.name}</p>
                      </td>
                      <td className="px-4 py-3 text-charbon/60 text-xs">
                        {doc.type === 'contract' ? 'Contrat' : 'Autre'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DOC_STATUS_COLORS[doc.status] ?? 'bg-sable/30 text-charbon/60'}`}>
                          {DOC_STATUS_LABELS[doc.status] ?? doc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-charbon/60 text-xs whitespace-nowrap">
                        {doc.createdAt
                          ? new Date(doc.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {doc.gridfsId ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              disabled={fileBusy === doc.id}
                              onClick={() => viewDoc(doc)}
                              className="text-xs px-3 py-1.5 rounded-lg font-medium border border-vert-foret/20 text-vert-foret hover:bg-vert-foret/5 transition-colors disabled:opacity-40"
                            >
                              {fileBusy === doc.id ? '...' : 'Voir'}
                            </button>
                            <button
                              type="button"
                              disabled={fileBusy === doc.id}
                              onClick={() => downloadDoc(doc)}
                              className="text-xs px-3 py-1.5 rounded-lg font-medium border border-sable/40 text-charbon/60 hover:bg-creme transition-colors disabled:opacity-40"
                            >
                              Télécharger
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-charbon/30">Pas de fichier</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {preview && (
        <>
          <div
            className="fixed inset-0 bg-charbon/40 backdrop-blur-sm z-40"
            onClick={closePreview}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col pointer-events-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-sable/30">
                <h3 className="font-heading text-base font-bold text-charbon truncate">{preview.title}</h3>
                <button
                  onClick={closePreview}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sable/30 text-charbon/50 transition-colors shrink-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <iframe
                src={preview.url}
                title={preview.title}
                className="flex-1 w-full rounded-b-3xl"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── User detail panel ────────────────────────────────────────────────────────

interface EditForm {
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

interface UserPanelProps {
  user: User;
  onClose: () => void;
  onSaved: (updated: User) => void;
}

function UserPanel({ user, onClose, onSaved }: UserPanelProps) {
  const [form, setForm] = useState<EditForm>({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    isActive: user.isActive,
  });
  const [pendingRole, setPendingRole] = useState<UserRole>(user.role as UserRole);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [pointsAmount, setPointsAmount] = useState('');
  const [pointsReason, setPointsReason] = useState('');
  const [pointsSaving, setPointsSaving] = useState(false);
  const [pointsError, setPointsError] = useState<string | null>(null);
  const [pointsSuccess, setPointsSuccess] = useState(false);
  const [displayedPoints, setDisplayedPoints] = useState(user.points);

  async function handleAdjustPoints(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseInt(pointsAmount, 10);
    if (!amount || !pointsReason.trim()) return;
    setPointsSaving(true);
    setPointsError(null);
    setPointsSuccess(false);
    try {
      await api.post(`/users/${user._id}/points`, { amount, reason: pointsReason });
      setDisplayedPoints((prev) => prev + amount);
      const { data: refreshed } = await api.get<User>(`/users/${user._id}`);
      onSaved(refreshed);
      setPointsAmount('');
      setPointsReason('');
      setPointsSuccess(true);
    } catch (err: any) {
      setPointsError(err?.response?.data?.message ?? 'Erreur lors de l\'ajustement');
    } finally {
      setPointsSaving(false);
    }
  }

  function field(key: keyof EditForm, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let updated: User;
      const { data } = await api.patch<User>(`/users/${user._id}`, form);
      updated = data;
      if (pendingRole !== user.role) {
        const { data: withRole } = await api.patch<User>(`/users/${user._id}`, { role: pendingRole });
        updated = withRole;
      }
      onSaved(updated);
      setSaved(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-charbon/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col pointer-events-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-sable/30">
          <div>
            <h2 className="font-heading text-lg font-bold text-charbon">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-xs text-charbon/40 mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sable/30 text-charbon/50 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-3 bg-creme border-b border-sable/20 flex gap-4">
          <div className="text-center">
            <p className="text-xs text-charbon/40">Points</p>
            <p className="font-semibold text-charbon">{displayedPoints}</p>
          </div>
          <div className="w-px bg-sable/30" />
          <div className="text-center">
            <p className="text-xs text-charbon/40">Membre depuis</p>
            <p className="font-semibold text-charbon text-xs">
              {new Date(user.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="w-px bg-sable/30" />
          <div className="text-center">
            <p className="text-xs text-charbon/40">Statut</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.isActive ? 'bg-vert-clair/10 text-vert-moyen' : 'bg-red-100 text-red-600'}`}>
              {user.isActive ? 'Actif' : 'Désactivé'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-charbon/60">Prénom</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => field('firstName', e.target.value)}
                  className="border border-sable/40 rounded-xl px-3 py-2 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/30"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-charbon/60">Nom</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => field('lastName', e.target.value)}
                  className="border border-sable/40 rounded-xl px-3 py-2 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/30"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-charbon/60">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => field('email', e.target.value)}
                className="border border-sable/40 rounded-xl px-3 py-2 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/30"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-charbon/60">Rôle</label>
              <select
                value={pendingRole}
                onChange={(e) => { setPendingRole(e.target.value as UserRole); setSaved(false); }}
                className="border border-sable/40 rounded-xl px-3 py-2 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/30"
              >
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-creme rounded-2xl">
              <div>
                <p className="text-sm font-medium text-charbon">Compte actif</p>
                <p className="text-xs text-charbon/40 mt-0.5">L'utilisateur peut se connecter</p>
              </div>
              <button
                type="button"
                onClick={() => field('isActive', !form.isActive)}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-vert-moyen' : 'bg-sable/50'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
            )}

            {saved && (
              <p className="text-sm text-vert-foret bg-vert-foret/5 px-4 py-3 rounded-xl">✓ Modifications sauvegardées</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-vert-foret text-white py-3 rounded-xl text-sm font-semibold hover:bg-vert-moyen transition-colors disabled:opacity-50"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
            </button>
          </form>

          {/* ── Ajustement points ── */}
          <div className="px-6 py-5 border-t border-sable/20 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-charbon">Ajuster les points</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-charbon/60">Montant</label>
                <input
                  type="number"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(e.target.value)}
                  placeholder="Ex : 50 ou -20"
                  className="border border-sable/40 rounded-xl px-3 py-2 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-charbon/60">Raison</label>
                <input
                  type="text"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  placeholder="Ex : Correction litige"
                  className="border border-sable/40 rounded-xl px-3 py-2 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/30"
                />
              </div>
            </div>
            {pointsError && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">{pointsError}</p>
            )}
            {pointsSuccess && (
              <p className="text-xs text-vert-foret bg-vert-foret/5 px-3 py-2 rounded-xl">✓ Points ajustés</p>
            )}
            <button
              type="button"
              onClick={handleAdjustPoints}
              disabled={pointsSaving || !pointsAmount || !pointsReason.trim()}
              className="w-full bg-ambre text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-ambre/80 transition-colors disabled:opacity-40"
            >
              {pointsSaving ? 'En cours...' : 'Appliquer'}
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [neighbourhoods, setNeighbourhoods] = useState<Neighbourhood[]>([]);
  const [neighbourhoodCounts, setNeighbourhoodCounts] = useState<Record<string, number>>({});
  const [neighbourhoodLoading, setNeighbourhoodLoading] = useState(true);
  const [neighbourhoodSearch, setNeighbourhoodSearch] = useState('');

  useEffect(() => {
    api.get<User[]>('/users')
      .then(({ data }) => setUsers(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get<Neighbourhood[]>('/neighbourhoods')
      .then(async ({ data }) => {
        setNeighbourhoods(data);
        const counts = await Promise.all(
          data.map((n) =>
            api.get<{ count: number }>('/users/count', { params: { neighbourhoodId: String(n.id) } })
              .then(({ data }) => [String(n.id), data.count] as const)
              .catch(() => [String(n.id), 0] as const),
          ),
        );
        setNeighbourhoodCounts(Object.fromEntries(counts));
      })
      .finally(() => setNeighbourhoodLoading(false));
  }, []);

  async function quickUpdate(id: string, patch: { role?: UserRole; isActive?: boolean }) {
    setUpdating(id);
    try {
      const { data } = await api.patch<User>(`/users/${id}`, patch);
      setUsers((prev) => prev.map((u) => (u._id === id ? data : u)));
      if (selectedUser?._id === id) setSelectedUser(data);
    } finally {
      setUpdating(null);
    }
  }

  function handleSaved(updated: User) {
    setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
    setSelectedUser(updated);
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q)
    );
  });

  const filteredNeighbourhoods = neighbourhoods.filter((n) =>
    n.name.toLowerCase().includes(neighbourhoodSearch.toLowerCase()),
  );

  return (
    <div className="flex flex-col min-h-full px-4 lg:px-8 py-8 gap-8 overflow-y-auto">
      <h1 className="font-heading text-2xl font-bold text-charbon">Administration</h1>

      <h2 className="font-heading text-xl font-bold text-charbon mt-2">Utilisateurs</h2>

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un utilisateur..."
          className="border border-sable/40 rounded-xl px-3 py-2 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/30 w-64"
        />
        <span className="text-xs text-charbon/40">{filtered.length} utilisateur{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="text-sm text-charbon/40">Chargement...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sable/30 max-h-[50vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-creme border-b border-sable/30">
                <th className="text-left px-5 py-3.5 font-semibold text-charbon/70 text-xs">Utilisateur</th>
                <th className="text-left px-5 py-3.5 font-semibold text-charbon/70 text-xs">Email</th>
                <th className="text-left px-5 py-3.5 font-semibold text-charbon/70 text-xs">Rôle</th>
                <th className="text-left px-5 py-3.5 font-semibold text-charbon/70 text-xs">Points</th>
                <th className="text-left px-5 py-3.5 font-semibold text-charbon/70 text-xs">Statut</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u._id}
                  onClick={() => setSelectedUser(u)}
                  className={`border-b border-sable/20 last:border-0 cursor-pointer transition-colors ${
                    selectedUser?._id === u._id ? 'bg-vert-foret/5' : 'hover:bg-creme/40'
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-charbon">{u.firstName} {u.lastName}</span>
                  </td>
                  <td className="px-5 py-3.5 text-charbon/60">{u.email}</td>
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={u.role}
                      disabled={updating === u._id}
                      onChange={(e) => quickUpdate(u._id, { role: e.target.value as UserRole })}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-vert-foret/30 ${ROLE_COLORS[u.role as UserRole]}`}
                    >
                      {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-charbon/60">{u.points}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.isActive ? 'bg-vert-clair/10 text-vert-moyen' : 'bg-red-100 text-red-600'}`}>
                      {u.isActive ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      disabled={updating === u._id}
                      onClick={() => quickUpdate(u._id, { isActive: !u.isActive })}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 ${
                        u.isActive
                          ? 'border border-red-200 text-red-600 hover:bg-red-50'
                          : 'border border-vert-foret/20 text-vert-foret hover:bg-vert-foret/5'
                      }`}
                    >
                      {updating === u._id ? '...' : u.isActive ? 'Désactiver' : 'Réactiver'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-sm text-charbon/40 py-8">Aucun utilisateur trouvé</p>
          )}
        </div>
      )}

      <h2 className="font-heading text-xl font-bold text-charbon mt-4">Quartiers</h2>

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={neighbourhoodSearch}
          onChange={(e) => setNeighbourhoodSearch(e.target.value)}
          placeholder="Rechercher un quartier..."
          className="border border-sable/40 rounded-xl px-3 py-2 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/30 w-64"
        />
        <span className="text-xs text-charbon/40">
          {filteredNeighbourhoods.length} quartier{filteredNeighbourhoods.length !== 1 ? 's' : ''}
        </span>
      </div>

      {neighbourhoodLoading ? (
        <div className="text-sm text-charbon/40">Chargement...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sable/30 max-h-[40vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-creme border-b border-sable/30">
                <th className="text-left px-5 py-3.5 font-semibold text-charbon/70 text-xs">Nom</th>
                <th className="text-left px-5 py-3.5 font-semibold text-charbon/70 text-xs">Habitants actifs</th>
                <th className="text-left px-5 py-3.5 font-semibold text-charbon/70 text-xs">Créé le</th>
              </tr>
            </thead>
            <tbody>
              {filteredNeighbourhoods.map((n) => (
                <tr key={String(n.id)} className="border-b border-sable/20 last:border-0 hover:bg-creme/40 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-charbon">{n.name}</td>
                  <td className="px-5 py-3.5 text-charbon/60">{neighbourhoodCounts[String(n.id)] ?? 0}</td>
                  <td className="px-5 py-3.5 text-charbon/60">
                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredNeighbourhoods.length === 0 && (
            <p className="text-center text-sm text-charbon/40 py-8">Aucun quartier trouvé</p>
          )}
        </div>
      )}

      <h2 className="font-heading text-xl font-bold text-charbon mt-4">Incidents</h2>
      <IncidentsConsole neighbourhoods={neighbourhoods} />

      <h2 className="font-heading text-xl font-bold text-charbon mt-4">Console</h2>
      <QueryConsole />

      {selectedUser && (
        <UserPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
