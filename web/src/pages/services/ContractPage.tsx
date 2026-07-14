import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import api from '../../api/axios';
import { otpApi } from '../../api/otp';
import { useUser } from '../../contexts/useUser';

interface ContractState {
  announcementTitle?: string;
  authorName?: string;
  acceptorName?: string;
  documentId?: string;
  announcementId?: string;
  from?: string;
}

interface HoodlyDocument {
  id: string;
  title: string;
  status: 'draft' | 'pending' | 'signed' | 'archived' | 'refused';
  signers: string[];
  signatures: { userId: string; hash: string; date: string }[];
  announcementId?: string;
}

type SignStep = 'idle' | 'otp-send' | 'otp-verify' | 'canvas' | 'submitting' | 'done';

export default function ContractPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const state = (location.state as ContractState) ?? {};

  const [doc, setDoc] = useState<HoodlyDocument | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(!!state.documentId);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [step, setStep] = useState<SignStep>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [signError, setSignError] = useState<string | null>(null);

  const sigCanvas = useRef<SignatureCanvas>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(600);
  const [hasSig, setHasSig] = useState(false);

  const measureCanvas = useCallback(() => {
    if (canvasWrapRef.current) {
      setCanvasWidth(canvasWrapRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    if (step === 'canvas') {
      setTimeout(measureCanvas, 0);
    }
  }, [step, measureCanvas]);

  useEffect(() => {
    if (state.documentId) {
      api.get<HoodlyDocument>(`/documents/${state.documentId}`)
        .then(({ data }) => {
          setDoc(data);
          return api.get(`/documents/${state.documentId}/file`, { responseType: 'blob' });
        })
        .then(({ data: blob }) => {
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        })
        .finally(() => setLoadingDoc(false));
    }
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [state.documentId]);

  const documentId = doc?.id ?? state.documentId;
  const hasSignedMe = doc?.signatures?.some(
    (s) => s.userId === user?._id || s.userId?.toString() === user?._id
  );
  const alreadySigned = doc?.status === 'signed';
  const canSign = !!documentId && !hasSignedMe && !alreadySigned;

  function hasSigned(signerId?: string) {
    if (!signerId) return false;
    return !!doc?.signatures?.some((s) => s.userId === signerId || s.userId?.toString() === signerId);
  }
  const authorSigned = hasSigned(doc?.signers?.[0]);
  const acceptorSigned = hasSigned(doc?.signers?.[1]);

  // ─── OTP flow ───────────────────────────────────────────────────────────────

  async function startSign() {
    if (!user) return;
    setStep('otp-send');
    setOtpError(null);
    try {
      await otpApi.send(user.email, user.firstName);
      setStep('otp-verify');
    } catch {
      setOtpError('Impossible d\'envoyer le code OTP');
      setStep('idle');
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setOtpError(null);
    try {
      const { data } = await otpApi.verify(user.email, otpCode);
      setOtpToken(data.otpToken);
      setStep('canvas');
    } catch {
      setOtpError('Code invalide ou expiré');
    }
  }

  async function submitSign() {
    if (!documentId || !otpToken) return;
    setStep('submitting');
    setSignError(null);
    try {
      const dataUrl = sigCanvas.current?.toDataURL('image/png') ?? '';
      const signatureImage = dataUrl.split(',')[1]; // base64 sans préfixe
      const updated = await api.post<HoodlyDocument>(`/documents/${documentId}/sign`, {
        otpToken,
        signatureImage,
      });
      setDoc(updated.data);
      setStep('done');
    } catch (err: any) {
      setSignError(err?.response?.data?.message ?? 'Erreur lors de la signature');
      setStep('canvas');
    }
  }

  const [refusing, setRefusing] = useState(false);

  async function handleRefuse() {
    if (!documentId) { goBack(); return; }
    setRefusing(true);
    try {
      const updated = await api.post<HoodlyDocument>(`/documents/${documentId}/refuse`);
      setDoc(updated.data);
    } catch {
      // non-fatal — navigate back anyway
    } finally {
      setRefusing(false);
      goBack();
    }
  }

  function goBack() {
    if (state.from) navigate(state.from);
    else navigate(-1);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loadingDoc) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sable text-sm">Chargement du contrat...</p>
      </div>
    );
  }

  const title = doc?.title ?? (state.announcementTitle ? `Contrat de service — ${state.announcementTitle}` : 'Contrat de service');
  const signedCount = doc?.signatures?.length ?? 0;
  const signerCount = doc?.signers?.length ?? 0;

  return (
    <div className="flex flex-col min-h-full px-4 lg:px-8 py-8 gap-6">
      <button
        onClick={goBack}
        className="flex items-center gap-2 text-vert-foret font-sans text-sm font-semibold w-fit"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Retour
      </button>

      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-charbon">Contrat de service</h1>
        <p className="font-sans text-sm text-sable">Ce contrat doit être signé par les deux parties avant le début du service.</p>
      </div>

      {/* Contrat card */}
      <div className="rounded-2xl border border-sable/40 bg-white p-6 flex flex-col gap-5">
        <div className="flex items-center gap-3 pb-4 border-b border-sable/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5EE]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-vert-moyen">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="font-sans text-xs text-sable uppercase tracking-wide">Document</p>
            <p className="font-sans text-sm font-semibold text-charbon">{title}</p>
          </div>
          {doc && (
            <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${
              doc.status === 'signed' ? 'bg-vert-clair/10 text-vert-moyen' :
              doc.status === 'pending' ? 'bg-ambre/10 text-ambre' :
              'bg-sable/30 text-charbon/60'
            }`}>
              {doc.status === 'signed' ? 'Signé' : doc.status === 'pending' ? 'En attente de signature' : doc.status}
            </span>
          )}
        </div>

        {/* Parties */}
        {(state.authorName || state.acceptorName) && (
          <div className="flex flex-col gap-3">
            {state.authorName && (
              <div className="flex items-center justify-between rounded-xl bg-creme px-4 py-3">
                <div>
                  <p className="font-sans text-xs text-sable">Prestataire</p>
                  <p className="font-sans text-sm font-semibold text-charbon">{state.authorName}</p>
                </div>
                {authorSigned ? (
                  <span className="rounded-full bg-vert-clair/20 px-3 py-1 font-sans text-xs font-bold text-vert-foret">Signé</span>
                ) : (
                  <span className="rounded-full bg-ambre/20 px-3 py-1 font-sans text-xs font-bold text-ambre">En attente</span>
                )}
              </div>
            )}
            {state.acceptorName && (
              <div className="flex items-center justify-between rounded-xl bg-creme px-4 py-3">
                <div>
                  <p className="font-sans text-xs text-sable">Bénéficiaire</p>
                  <p className="font-sans text-sm font-semibold text-charbon">{state.acceptorName}</p>
                </div>
                {acceptorSigned ? (
                  <span className="rounded-full bg-vert-clair/20 px-3 py-1 font-sans text-xs font-bold text-vert-foret">Signé</span>
                ) : (
                  <span className="rounded-full bg-ambre/20 px-3 py-1 font-sans text-xs font-bold text-ambre">En attente</span>
                )}
              </div>
            )}
          </div>
        )}

        {doc && signerCount > 0 && (
          <p className="text-xs text-charbon/50">{signedCount}/{signerCount} signature{signerCount !== 1 ? 's' : ''} collectée{signedCount !== 1 ? 's' : ''}</p>
        )}

        {/* Already signed */}
        {(hasSignedMe || alreadySigned) && (
          <div className="rounded-xl bg-vert-foret/5 border border-vert-foret/20 px-4 py-3 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-vert-foret">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="font-sans text-sm text-vert-foret font-medium">
              {alreadySigned ? 'Contrat entièrement signé par toutes les parties.' : 'Vous avez déjà signé ce contrat.'}
            </p>
          </div>
        )}
      </div>

      {/* PDF viewer */}
      {pdfUrl && (
        <div className="flex flex-col gap-2">
          <div className="rounded-2xl border border-sable/30 overflow-hidden" style={{ height: 600 }}>
            <iframe
              src={pdfUrl}
              className="w-full h-full"
              title="Contrat PDF"
            />
          </div>
          <a
            href={pdfUrl}
            download={`${title}.pdf`}
            className="self-end flex items-center gap-2 text-sm font-semibold text-vert-foret hover:text-vert-moyen transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v13M7 11l5 5 5-5M3 21h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Télécharger le PDF
          </a>
        </div>
      )}

      {/* ─── Sign steps ────────────────────────────────────────────────────────── */}

      {/* Step: OTP verify */}
      {step === 'otp-verify' && (
        <div className="rounded-2xl border border-sable/40 bg-white p-6 flex flex-col gap-4">
          <div>
            <h2 className="font-heading text-base font-bold text-charbon">Vérification en deux étapes</h2>
            <p className="text-xs text-charbon/50 mt-1">Un code a été envoyé à <strong>{user?.email}</strong></p>
          </div>
          <form onSubmit={verifyOtp} className="flex flex-col gap-4">
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Code à 6 chiffres"
              className="border border-sable/40 rounded-xl px-4 py-3 text-lg text-charbon text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-vert-foret/30"
              maxLength={6}
              autoFocus
            />
            {otpError && <p className="text-sm text-red-600">{otpError}</p>}
            <button
              type="submit"
              disabled={otpCode.length < 6}
              className="w-full bg-vert-foret text-white py-3 rounded-xl text-sm font-semibold hover:bg-vert-moyen transition-colors disabled:opacity-40"
            >
              Vérifier le code
            </button>
          </form>
        </div>
      )}

      {/* Step: signature canvas */}
      {step === 'canvas' && (
        <div className="rounded-2xl border border-sable/40 bg-white p-6 flex flex-col gap-4">
          <div>
            <h2 className="font-heading text-base font-bold text-charbon">Votre signature</h2>
            <p className="text-xs text-charbon/50 mt-1">Dessinez votre signature dans le cadre ci-dessous</p>
          </div>
          <div ref={canvasWrapRef} className="border-2 border-dashed border-sable/40 rounded-2xl overflow-hidden bg-creme/30">
            <SignatureCanvas
              ref={sigCanvas}
              penColor="#1E4D35"
              canvasProps={{ width: canvasWidth, height: 176, className: 'w-full h-44' }}
              onEnd={() => setHasSig(true)}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { sigCanvas.current?.clear(); setHasSig(false); }}
              className="px-4 py-2 border border-sable/40 rounded-xl text-sm text-charbon/60 hover:bg-creme transition-colors"
            >
              Effacer
            </button>
            <button
              type="button"
              onClick={submitSign}
              disabled={!hasSig}
              className="flex-1 bg-vert-foret text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-vert-moyen transition-colors disabled:opacity-40"
            >
              Confirmer la signature
            </button>
          </div>
          {signError && <p className="text-sm text-red-600">{signError}</p>}
        </div>
      )}

      {/* Step: done */}
      {step === 'done' && (
        <div className="rounded-2xl bg-vert-foret/5 border border-vert-foret/20 px-6 py-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-vert-foret/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-vert-foret">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-vert-foret text-sm">Signature enregistrée</p>
            <p className="text-xs text-charbon/50 mt-0.5">
              {doc?.status === 'signed'
                ? 'Toutes les parties ont signé — contrat finalisé.'
                : 'En attente de la signature de l\'autre partie.'}
            </p>
          </div>
        </div>
      )}

      {/* ─── Action buttons ────────────────────────────────────────────────────── */}
      {step === 'idle' && (
        <div className="flex gap-3 mt-auto">
          {!alreadySigned && doc?.status !== 'refused' && (
            <button
              onClick={handleRefuse}
              disabled={refusing}
              className="flex-1 rounded-xl border-2 border-sable py-3 font-sans text-sm font-semibold text-sable hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-40"
            >
              {refusing ? 'Refus en cours...' : 'Refuser'}
            </button>
          )}
          {canSign ? (
            <button
              onClick={startSign}
              className="flex-1 rounded-xl bg-vert-foret py-3 font-sans text-sm font-semibold text-white hover:bg-vert-moyen transition-colors"
            >
              Signer le contrat
            </button>
          ) : (
            <div className="flex-1 rounded-xl bg-vert-foret/20 py-3 font-sans text-sm font-semibold text-vert-foret/50 text-center">
              {hasSignedMe ? 'Déjà signé' : 'Signature indisponible'}
            </div>
          )}
        </div>
      )}

      {step === 'otp-send' && (
        <p className="text-sm text-charbon/40 text-center">Envoi du code OTP...</p>
      )}
    </div>
  );
}
