import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useUser } from '../../contexts/useUser';

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

const CATEGORIES = ['Voirie', 'Sécurité', 'Propreté', 'Bruit', 'Autre'];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface IncidentFormModalProps {
  initial?: Incident;
  neighbourhoodId: string;
  reportedBy: string;
  onSaved: (incident: Incident) => void;
  onClose: () => void;
}

function IncidentFormModal({ initial, neighbourhoodId, reportedBy, onSaved, onClose }: IncidentFormModalProps) {
  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !category) return;
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit) {
        const { data } = await api.patch<Incident>(`/incidents/${initial.id}`, {
          title: title.trim(),
          description: description.trim(),
          category,
        });
        onSaved(data);
      } else {
        const { data } = await api.post<Incident>('/incidents', {
          title: title.trim(),
          description: description.trim(),
          category,
          reportedBy,
          neighborhoodId: neighbourhoodId,
        });
        onSaved(data);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? `Erreur lors ${isEdit ? 'de la modification' : 'du signalement'}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-charbon/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-sable/20">
          <h2 className="font-heading text-lg font-bold text-charbon">
            {isEdit ? "Modifier l'incident" : 'Signaler un incident'}
          </h2>
          <button onClick={onClose} className="text-charbon/40 hover:text-charbon text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-charbon/60 mb-1.5 block">Catégorie *</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    category === cat
                      ? 'bg-vert-foret text-white border-vert-foret'
                      : 'border-sable text-charbon/60 hover:border-vert-foret'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-charbon/60 mb-1.5 block">Titre *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lampadaire cassé"
              className="w-full border border-sable rounded-xl px-4 py-2.5 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/40 focus:border-vert-foret"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-charbon/60 mb-1.5 block">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Le lampadaire au bout de la rue ne fonctionne plus depuis 3 jours."
              className="w-full border border-sable rounded-xl px-4 py-2.5 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/40 focus:border-vert-foret resize-none"
              rows={4}
              required
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !category}
            className="w-full bg-vert-foret text-white py-3 rounded-xl text-sm font-medium hover:bg-vert-moyen transition-colors disabled:opacity-50"
          >
            {submitting ? 'Envoi...' : isEdit ? 'Enregistrer' : 'Signaler'}
          </button>
        </form>
      </div>
    </div>
  );
}

interface IncidentCardProps {
  incident: Incident;
  deleting: boolean;
  onEdit: (incident: Incident) => void;
  onDelete: (id: string) => void;
}

function IncidentCard({ incident, deleting, onEdit, onDelete }: IncidentCardProps) {
  const isOpen = incident.status === 'open';
  return (
    <div className="bg-white rounded-2xl border border-sable/20 shadow-sm px-5 py-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="font-heading font-semibold text-charbon text-base leading-snug flex-1">
          {incident.title}
        </p>
        <span
          className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
            isOpen ? 'bg-ambre/10 text-ambre' : 'bg-vert-clair/15 text-vert-foret'
          }`}
        >
          {isOpen ? 'Ouvert' : 'Résolu'}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs px-2 py-0.5 rounded-full bg-sable/20 text-charbon/60">{incident.category}</span>
        <span className="text-xs text-charbon/40">{formatDate(incident.reportedAt)}</span>
      </div>

      <p className="text-sm text-charbon/70 leading-relaxed whitespace-pre-wrap">{incident.description}</p>

      <div className="mt-3 flex items-center gap-4">
        <button
          onClick={() => onEdit(incident)}
          className="text-xs text-vert-foret font-medium hover:underline"
        >
          Modifier
        </button>
        <button
          onClick={() => onDelete(incident.id)}
          disabled={deleting}
          className="text-xs text-red-500 font-medium hover:underline disabled:opacity-50"
        >
          {deleting ? 'Suppression...' : 'Supprimer'}
        </button>
      </div>
    </div>
  );
}

export default function IncidentsPage() {
  const { user } = useUser();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    if (!user?.neighbourhoodId) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get<Incident[]>('/incidents');
      setIncidents(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  function handleSaved(incident: Incident) {
    setIncidents((prev) => {
      const exists = prev.some((i) => i.id === incident.id);
      return exists ? prev.map((i) => (i.id === incident.id ? incident : i)) : [incident, ...prev];
    });
    setShowModal(false);
    setEditingIncident(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce signalement ?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/incidents/${id}`);
      setIncidents((prev) => prev.filter((i) => i.id !== id));
    } catch {
      alert('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = incidents.filter((i) => {
    if (filter === 'open') return i.status === 'open';
    if (filter === 'resolved') return i.status === 'resolved';
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-creme">
      {/* Header */}
      <div className="px-5 lg:px-8 pt-6 pb-4 bg-white border-b border-sable/20 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-charbon">Incidents</h1>
            <p className="text-xs text-charbon/40 mt-0.5">Vos signalements</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-vert-foret text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-vert-moyen transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Signaler
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          {([['all', 'Tous'], ['open', 'Ouverts'], ['resolved', 'Résolus']] as const).map(([val, label]) => (
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
        ) : !user?.neighbourhoodId ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl mb-3">🏘️</span>
            <p className="text-charbon/60 font-medium">Aucun quartier assigné</p>
            <p className="text-sm text-charbon/40 mt-1">Rejoins un quartier pour signaler un incident</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl mb-3">🚧</span>
            <p className="text-charbon/60 font-medium">
              {filter === 'all'
                ? "Aucun incident signalé"
                : filter === 'open'
                ? 'Aucun incident ouvert'
                : 'Aucun incident résolu'}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 text-sm text-vert-foret font-medium hover:underline"
              >
                Signaler le premier incident
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl">
            {filtered.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                deleting={deletingId === incident.id}
                onEdit={setEditingIncident}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && user?.neighbourhoodId && (
        <IncidentFormModal
          neighbourhoodId={user.neighbourhoodId}
          reportedBy={String(user._id)}
          onSaved={handleSaved}
          onClose={() => setShowModal(false)}
        />
      )}

      {editingIncident && user?.neighbourhoodId && (
        <IncidentFormModal
          initial={editingIncident}
          neighbourhoodId={user.neighbourhoodId}
          reportedBy={String(user._id)}
          onSaved={handleSaved}
          onClose={() => setEditingIncident(null)}
        />
      )}
    </div>
  );
}
