import { useNavigate, useLocation } from 'react-router-dom';

interface ContractState {
  announcementTitle: string;
  authorName: string;
  acceptorName: string;
}

export default function ContractPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as ContractState) ?? {
    announcementTitle: 'Service',
    authorName: 'Habitant A',
    acceptorName: 'Habitant B',
  };

  return (
    <div className="flex flex-col min-h-full px-4 lg:px-8 py-8 gap-6">

      <button
        onClick={() => navigate('/services')}
        className="flex items-center gap-2 text-vert-foret font-sans text-sm font-semibold w-fit"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Retour aux services
      </button>

      {/* Header */}
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
            <p className="font-sans text-xs text-sable uppercase tracking-wide">Service concerné</p>
            <p className="font-sans text-sm font-semibold text-charbon">{state.announcementTitle}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl bg-creme px-4 py-3">
            <div>
              <p className="font-sans text-xs text-sable">Prestataire</p>
              <p className="font-sans text-sm font-semibold text-charbon">{state.authorName}</p>
            </div>
            <span className="rounded-full bg-ambre/20 px-3 py-1 font-sans text-xs font-bold text-ambre">En attente</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-creme px-4 py-3">
            <div>
              <p className="font-sans text-xs text-sable">Bénéficiaire</p>
              <p className="font-sans text-sm font-semibold text-charbon">{state.acceptorName}</p>
            </div>
            <span className="rounded-full bg-ambre/20 px-3 py-1 font-sans text-xs font-bold text-ambre">En attente</span>
          </div>
        </div>

        <div className="rounded-xl bg-[#FFF8EE] border border-ambre/20 px-4 py-3 flex items-start gap-2">
          <span className="text-ambre shrink-0 mt-0.5">ℹ️</span>
          <p className="font-sans text-xs text-charbon leading-relaxed">
            La signature numérique sera disponible prochainement. Les deux parties recevront une notification pour signer.
          </p>
        </div>
      </div>

      {/* Boutons */}
      <div className="flex gap-3 mt-auto">
        <button
          disabled
          className="flex-1 rounded-xl border-2 border-sable py-3 font-sans text-sm font-semibold text-sable cursor-not-allowed"
        >
          Refuser
        </button>
        <button
          disabled
          className="flex-1 rounded-xl bg-vert-foret py-3 font-sans text-sm font-semibold text-white opacity-50 cursor-not-allowed"
        >
          Signer le contrat
        </button>
      </div>
    </div>
  );
}
