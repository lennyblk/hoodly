import { useState, useEffect } from 'react';
import api from '../../api/axios';
import type { components } from '../../api/types.generated';
import { queryLangApi, type QueryLangResult } from '../../api/queryLang';

type User = components['schemas']['User'];
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

// ─── HQL Console ─────────────────────────────────────────────────────────────

const EXAMPLE_QUERIES = [
  'FIND documents WHERE status = "signed" AND type = "contract" LIMIT 10',
  'FIND documents WHERE (status = "pending" OR status = "draft") AND title CONTAINS "contrat"',
  'FIND documents WHERE ownerId = "64a1f2c3e4b5f6a7b8c9d0e2"',
  'FIND documents LIMIT 5',
];

function QueryConsole() {
  const [query, setQuery] = useState(EXAMPLE_QUERIES[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryLangResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runQuery() {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await queryLangApi.execute(query);
      setResult(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erreur lors de l\'exécution de la requête');
    } finally {
      setLoading(false);
    }
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
          </div>
          <pre className="bg-charbon text-vert-clair text-xs rounded-xl p-4 overflow-auto max-h-96">
            {JSON.stringify(result.results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── User detail panel ────────────────────────────────────────────────────────

interface EditForm {
  firstName: string;
  lastName: string;
  email: string;
  lang: 'fr' | 'en';
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
    lang: user.lang as 'fr' | 'en',
    isActive: user.isActive,
  });
  const [pendingRole, setPendingRole] = useState<UserRole>(user.role as UserRole);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
            <p className="font-semibold text-charbon">{user.points}</p>
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
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

          <div className="grid grid-cols-2 gap-4">
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-charbon/60">Langue</label>
              <select
                value={form.lang}
                onChange={(e) => field('lang', e.target.value)}
                className="border border-sable/40 rounded-xl px-3 py-2 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/30"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
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

  useEffect(() => {
    api.get<User[]>('/users')
      .then(({ data }) => setUsers(data))
      .finally(() => setLoading(false));
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

  return (
    <div className="flex flex-col h-full px-4 lg:px-8 py-8 gap-6">
      <h1 className="font-heading text-2xl font-bold text-charbon">Administration</h1>

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
        <div className="overflow-x-auto rounded-2xl border border-sable/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-creme border-b border-sable/30">
                <th className="text-left px-4 py-3 font-semibold text-charbon/70 text-xs">Utilisateur</th>
                <th className="text-left px-4 py-3 font-semibold text-charbon/70 text-xs">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-charbon/70 text-xs">Rôle</th>
                <th className="text-left px-4 py-3 font-semibold text-charbon/70 text-xs">Points</th>
                <th className="text-left px-4 py-3 font-semibold text-charbon/70 text-xs">Statut</th>
                <th className="px-4 py-3" />
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
                  <td className="px-4 py-3">
                    <span className="font-medium text-charbon">{u.firstName} {u.lastName}</span>
                  </td>
                  <td className="px-4 py-3 text-charbon/60">{u.email}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
                  <td className="px-4 py-3 text-charbon/60">{u.points}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.isActive ? 'bg-vert-clair/10 text-vert-moyen' : 'bg-red-100 text-red-600'}`}>
                      {u.isActive ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
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
