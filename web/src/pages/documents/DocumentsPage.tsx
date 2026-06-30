import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useUser } from '../../contexts/useUser';

interface HoodlyDocument {
  id: string;
  title: string;
  name: string;
  type: 'contract' | 'other';
  status: 'draft' | 'pending' | 'signed' | 'archived' | 'refused';
  ownerId: string;
  signers: string[];
  signatures: { userId: string; hash: string; date: string }[];
  announcementId?: string;
  createdAt: string;
}

const STATUS_LABELS: Record<HoodlyDocument['status'], string> = {
  draft: 'Brouillon',
  pending: 'En attente de signature',
  signed: 'Signé',
  archived: 'Archivé',
  refused: 'Refusé',
};

const STATUS_COLORS: Record<HoodlyDocument['status'], string> = {
  draft: 'bg-sable/30 text-charbon/60',
  pending: 'bg-ambre/10 text-ambre',
  signed: 'bg-vert-clair/10 text-vert-moyen',
  archived: 'bg-charbon/10 text-charbon/50',
  refused: 'bg-red-100 text-red-600',
};

const TYPE_LABELS: Record<HoodlyDocument['type'], string> = {
  contract: 'Contrat',
  other: 'Document',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Upload modal ──────────────────────────────────────────────────────────────

interface UploadModalProps {
  onClose: () => void;
  onUploaded: (doc: HoodlyDocument) => void;
}

function UploadModal({ onClose, onUploaded }: UploadModalProps) {
  const [title, setTitle] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', title.trim());
      form.append('type', 'other');
      if (signerEmail.trim()) form.append('signerEmail', signerEmail.trim());
      const { data } = await api.post<HoodlyDocument>('/documents/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploaded(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-charbon/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-5 border-b border-sable/30">
            <h2 className="font-heading text-lg font-bold text-charbon">Uploader un document</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sable/30 text-charbon/50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-charbon/60">Titre du document</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Contrat de jardinage"
                className="border border-sable/40 rounded-xl px-3 py-2 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/30"
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-charbon/60">
                Email de l'autre signataire <span className="font-normal text-charbon/30">(optionnel)</span>
              </label>
              <input
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="voisin@example.com"
                className="border border-sable/40 rounded-xl px-3 py-2 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-charbon/60">Fichier PDF</label>
              <div
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl px-4 py-8 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
                  file ? 'border-vert-foret/40 bg-vert-foret/5' : 'border-sable/40 hover:border-vert-foret/30 hover:bg-creme/50'
                }`}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className={file ? 'text-vert-foret' : 'text-charbon/30'}>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M14 2v6h6M12 11v6M9 14l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {file ? (
                  <div className="text-center">
                    <p className="text-sm font-medium text-vert-foret">{file.name}</p>
                    <p className="text-xs text-charbon/40 mt-0.5">{(file.size / 1024).toFixed(0)} Ko</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-charbon/60">Cliquer pour sélectionner</p>
                    <p className="text-xs text-charbon/30 mt-0.5">PDF uniquement, max 10 Mo</p>
                  </div>
                )}
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

            <button
              type="submit"
              disabled={!file || !title.trim() || uploading}
              className="w-full bg-vert-foret text-white py-3 rounded-xl text-sm font-semibold hover:bg-vert-moyen transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {uploading ? 'Upload en cours...' : 'Uploader'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Document card ────────────────────────────────────────────────────────────

interface DocCardProps {
  doc: HoodlyDocument;
  currentUserId: string;
}

function DocCard({ doc, currentUserId }: DocCardProps) {
  const navigate = useNavigate();
  const signerCount = doc.signers?.length ?? 0;
  const signedCount = doc.signatures?.length ?? 0;
  const hasSignedMe = doc.signatures?.some((s) => s.userId === currentUserId || s.userId?.toString() === currentUserId);
  const canSign = doc.status === 'pending' && !hasSignedMe;

  const isClickable = doc.status === 'pending' || doc.status === 'signed';

  function handleClick() {
    if (isClickable) {
      navigate(`/documents/${doc.id}`, {
        state: { documentId: doc.id, from: '/documents' },
      });
    }
  }

  return (
    <div
      onClick={isClickable ? handleClick : undefined}
      className={`rounded-2xl border border-sable/30 bg-white p-5 flex flex-col gap-3 transition-shadow ${isClickable ? 'cursor-pointer hover:shadow-md hover:border-vert-foret/30' : 'hover:shadow-sm'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5EE] flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-vert-moyen">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-sm text-charbon">{doc.title}</p>
            <p className="text-xs text-charbon/40 mt-0.5">{doc.name}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[doc.status]}`}>
          {STATUS_LABELS[doc.status]}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-charbon/50">
        <span className="bg-sable/20 px-2 py-0.5 rounded-full">{TYPE_LABELS[doc.type]}</span>
        <span>{formatDate(doc.createdAt)}</span>
        {signerCount > 0 && (
          <span>{signedCount}/{signerCount} signataire{signerCount !== 1 ? 's' : ''}</span>
        )}
        {hasSignedMe && (
          <span className="text-vert-moyen font-medium">✓ Signé par moi</span>
        )}
        {canSign && (
          <span className="text-vert-foret font-semibold">Cliquer pour signer →</span>
        )}
        {isClickable && !canSign && (
          <span className="text-sable font-medium">Voir le contrat →</span>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const { user } = useUser();
  const [docs, setDocs] = useState<HoodlyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [filter, setFilter] = useState<'all' | HoodlyDocument['status']>('all');

  useEffect(() => {
    api.get<HoodlyDocument[]>('/documents')
      .then(({ data }) => setDocs(data))
      .finally(() => setLoading(false));
  }, []);

  function handleUploaded(doc: HoodlyDocument) {
    setDocs((prev) => [doc, ...prev]);
    setShowUpload(false);
  }

  const filtered = filter === 'all' ? docs : docs.filter((d) => d.status === filter);

  return (
    <div className="flex flex-col h-full px-4 lg:px-8 py-8 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-charbon">Documents</h1>
          <p className="text-xs text-charbon/40 mt-0.5">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="bg-vert-foret text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-vert-moyen transition-colors flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Uploader un PDF
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'signed', 'draft', 'archived'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              filter === f
                ? 'bg-vert-foret text-white'
                : 'bg-sable/20 text-charbon/60 hover:bg-sable/40'
            }`}
          >
            {f === 'all' ? 'Tous' : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-sm text-charbon/40">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-16">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-charbon/20">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-charbon/40">
            {filter === 'all' ? 'Aucun document pour l\'instant' : `Aucun document « ${STATUS_LABELS[filter]} »`}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setShowUpload(true)}
              className="text-sm text-vert-foret font-medium hover:underline"
            >
              Uploader votre premier document
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((doc) => (
            <DocCard key={doc.id} doc={doc} currentUserId={user?._id ?? ''} />
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />
      )}
    </div>
  );
}
