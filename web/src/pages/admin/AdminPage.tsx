import { useState } from 'react';
import { queryLangApi, type QueryLangResult } from '../../api/queryLang';

const EXAMPLE_QUERIES = [
  'FIND documents WHERE status = "signed" AND type = "contract" LIMIT 10',
  'FIND events WHERE (status = "published" OR status = "draft") AND title CONTAINS "fete"',
  'FIND announcements WHERE isPaid = true AND points >= 4',
  'FIND votes LIMIT 5',
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
          FIND &lt;collection&gt; [WHERE &lt;condition&gt;] [LIMIT &lt;n&gt;]
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

export default function AdminPage() {
  return (
    <div className="flex flex-col h-full px-4 lg:px-8 py-8 gap-6">
      <h1 className="font-heading text-2xl font-bold text-charbon">Administration</h1>
      <QueryConsole />
    </div>
  );
}
