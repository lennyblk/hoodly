import { useState, useEffect } from 'react';

const MONTHS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const MONTHS_LONG = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const DAYS_LONG = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
function fmtDate(iso: string, long = false): string {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const day = parseInt(parts[2], 10);
  const mo = parseInt(parts[1], 10) - 1;
  const yr = parts[0];
  if (long) {
    const jsDate = new Date(`${iso}T00:00:00`);
    const wd = isNaN(jsDate.getTime()) ? '' : DAYS_LONG[jsDate.getDay()] + ' ';
    return `${wd}${day} ${MONTHS_LONG[mo] ?? ''} ${yr}`;
  }
  return `${day} ${MONTHS_SHORT[mo] ?? ''}`;
}
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import type { components } from '../../api/types.generated';
import { useUser } from '../../contexts/useUser';

type Announcement = components['schemas']['Announcement'];
type User = components['schemas']['User'];
interface Conversation { id: string; }

interface AvailabilitySlot {
  type: 'dates_exactes' | 'recurrent' | 'continu';
  dates?: string[];
  days?: string[];
  startTime?: string;
  endTime?: string;
  startDate?: string;
  durationWeeks?: number;
}

interface ServiceDetails {
  chosenDate?: string;
  chosenDates?: string[];
  startDate?: string;
  endDate?: string;
  recurrentMode?: 'continue' | 'exacte';
  durationWeeks?: number;
  timeSlot?: string;
  notes?: string;
}

interface AnnouncementWithAvail extends Announcement {
  availabilities?: AvailabilitySlot[];
}

function AvailabilityDisplay({ slot }: { slot: AvailabilitySlot }) {
  if (slot.type === 'recurrent') {
    return (
      <div className="rounded-xl bg-vert-foret/5 border border-vert-foret/20 px-4 py-3">
        <p className="text-xs font-semibold text-vert-foret mb-1">Récurrent</p>
        <p className="text-sm text-charbon">{slot.days?.join(', ')} — {slot.startTime} à {slot.endTime}</p>
      </div>
    );
  }
  if (slot.type === 'dates_exactes') {
    return (
      <div className="rounded-xl bg-vert-foret/5 border border-vert-foret/20 px-4 py-3">
        <p className="text-xs font-semibold text-vert-foret mb-1">Dates disponibles</p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {slot.dates?.map((d) => (
            <span key={d} className="bg-vert-foret/10 text-vert-foret text-xs font-medium px-2.5 py-1 rounded-full">
              {fmtDate(d)}
            </span>
          ))}
        </div>
        {(slot.startTime || slot.endTime) && (
          <p className="text-xs text-sable mt-1.5">{slot.startTime} – {slot.endTime}</p>
        )}
      </div>
    );
  }
  if (slot.type === 'continu') {
    const start = slot.startDate ? fmtDate(slot.startDate, true) : '—';
    return (
      <div className="rounded-xl bg-vert-foret/5 border border-vert-foret/20 px-4 py-3">
        <p className="text-xs font-semibold text-vert-foret mb-1">Prestation continue</p>
        <p className="text-sm text-charbon">À partir du {start} — {slot.durationWeeks} semaine{(slot.durationWeeks ?? 0) > 1 ? 's' : ''}</p>
      </div>
    );
  }
  return null;
}

interface AcceptModalProps {
  announcement: AnnouncementWithAvail;
  onClose: () => void;
  onConfirm: (details: ServiceDetails) => void;
  accepting: boolean;
  error: string | null;
}

function AcceptModal({ announcement, onClose, onConfirm, accepting, error }: AcceptModalProps) {
  const slots = announcement.availabilities ?? [];
  const [details, setDetails] = useState<ServiceDetails>({});
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(slots.length === 1 ? 0 : null);

  const slot = selectedSlotIdx !== null ? slots[selectedSlotIdx] : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalDetails: ServiceDetails = { ...details };
    if (slot?.type === 'recurrent' && slot.startTime && slot.endTime) {
      finalDetails.timeSlot = `${slot.startTime}–${slot.endTime}`;
    }
    onConfirm(finalDetails);
  }

  return (
    <>
      <div className="fixed inset-0 bg-charbon/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg flex flex-col pointer-events-auto max-h-[90vh] overflow-y-auto">

          <div className="flex items-center justify-between px-6 py-5 border-b border-sable/30 sticky top-0 bg-white z-10">
            <div>
              <h2 className="font-heading text-lg font-bold text-charbon">Préciser votre prestation</h2>
              <p className="text-xs text-sable mt-0.5">Choisissez parmi les disponibilités du prestataire</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sable/30 text-charbon/50 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">

            {/* Disponibilités du prestataire */}
            {slots.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-charbon/60 uppercase tracking-wide">Disponibilités du prestataire</p>
                {slots.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedSlotIdx(i)}
                    className={`text-left rounded-xl border-2 transition-colors p-0 overflow-hidden ${selectedSlotIdx === i ? 'border-vert-foret' : 'border-transparent'}`}
                  >
                    <AvailabilityDisplay slot={s} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-sable/10 px-4 py-3">
                <p className="text-sm text-charbon/60">Aucune disponibilité structurée — précisez vos besoins dans les notes.</p>
              </div>
            )}

            {/* Champs selon le type de slot sélectionné */}
            {slot?.type === 'dates_exactes' && slot.dates && slot.dates.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-charbon/60">Date souhaitée</label>
                <select
                  value={details.chosenDate ?? ''}
                  onChange={(e) => setDetails((d) => ({ ...d, chosenDate: e.target.value }))}
                  className="border border-sable/40 rounded-xl px-3 py-2.5 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/30"
                  required
                >
                  <option value="">Choisir une date…</option>
                  {slot.dates.map((d) => (
                    <option key={d} value={d}>
                      {fmtDate(d, true)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {slot?.type === 'recurrent' && slot.days && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-charbon/60">Jours souhaités</label>
                    <button
                      type="button"
                      onClick={() => setDetails((d) => ({ ...d, chosenDates: slot.days }))}
                      className="text-xs text-vert-foret font-semibold hover:underline"
                    >
                      Tous sélectionner
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {slot.days.map((day) => {
                      const selected = (details.chosenDates ?? []).includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setDetails((d) => {
                            const prev = d.chosenDates ?? [];
                            return {
                              ...d,
                              chosenDates: selected
                                ? prev.filter((x) => x !== day)
                                : [...prev, day],
                            };
                          })}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                            selected
                              ? 'bg-vert-foret text-white border-vert-foret'
                              : 'bg-white text-charbon border-sable/50 hover:border-vert-foret/50'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  {details.chosenDates && details.chosenDates.length > 0 && (
                    <p className="text-xs text-sable">{details.chosenDates.length} jour{details.chosenDates.length > 1 ? 's' : ''} sélectionné{details.chosenDates.length > 1 ? 's' : ''} — créneau {slot.startTime}–{slot.endTime}</p>
                  )}
                </div>

                {/* Sous-mode : continue ou exacte */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-charbon/60">Type de prestation</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['continue', 'exacte'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setDetails((d) => ({ ...d, recurrentMode: mode, endDate: undefined }))}
                        className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                          details.recurrentMode === mode
                            ? 'bg-vert-foret text-white border-vert-foret'
                            : 'bg-white text-charbon border-sable/50 hover:border-vert-foret/50'
                        }`}
                      >
                        {mode === 'continue' ? 'Continue (sans fin)' : 'Dates exactes'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date de début */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-charbon/60">Date de première séance</label>
                  <input
                    type="date"
                    value={details.chosenDate ?? ''}
                    onChange={(e) => setDetails((d) => ({ ...d, chosenDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="border border-sable/40 rounded-xl px-3 py-2.5 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/30"
                  />
                </div>

                {/* Date de fin — seulement si exacte */}
                {details.recurrentMode === 'exacte' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-charbon/60">Date de dernière séance</label>
                    <input
                      type="date"
                      value={(details as any).endDate ?? ''}
                      onChange={(e) => setDetails((d) => ({ ...d, endDate: e.target.value } as any))}
                      min={details.chosenDate ?? new Date().toISOString().split('T')[0]}
                      className="border border-sable/40 rounded-xl px-3 py-2.5 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/30"
                    />
                  </div>
                )}
              </div>
            )}

            {slot?.type === 'continu' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-charbon/60">Date de début souhaitée</label>
                  <input
                    type="date"
                    value={details.startDate ?? ''}
                    onChange={(e) => setDetails((d) => ({ ...d, startDate: e.target.value }))}
                    min={slot.startDate ?? new Date().toISOString().split('T')[0]}
                    className="border border-sable/40 rounded-xl px-3 py-2.5 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/30"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-charbon/60">Durée (sem.)</label>
                  <input
                    type="number"
                    min={1}
                    max={slot.durationWeeks ?? 52}
                    value={details.durationWeeks ?? ''}
                    onChange={(e) => setDetails((d) => ({ ...d, durationWeeks: Number(e.target.value) }))}
                    placeholder={`max ${slot.durationWeeks ?? '?'}`}
                    className="border border-sable/40 rounded-xl px-3 py-2.5 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/30"
                    required
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-charbon/60">
                Notes <span className="font-normal text-charbon/30">(optionnel)</span>
              </label>
              <textarea
                rows={3}
                value={details.notes ?? ''}
                onChange={(e) => setDetails((d) => ({ ...d, notes: e.target.value }))}
                placeholder="Précisions sur l'accès, matériel nécessaire…"
                className="border border-sable/40 rounded-xl px-3 py-2.5 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-vert-foret/30 resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

            <button
              type="submit"
              disabled={accepting || (slots.length > 0 && selectedSlotIdx === null)}
              className="w-full bg-vert-foret text-white py-3 rounded-xl text-sm font-semibold hover:bg-vert-moyen transition-colors disabled:opacity-40"
            >
              {accepting ? 'Génération du contrat…' : 'Confirmer et générer le contrat'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default function ServiceDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const [announcement, setAnnouncement] = useState<AnnouncementWithAvail | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contacting, setContacting] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api.get<AnnouncementWithAvail>(`/announcements/${id}`)
      .then(({ data }) => {
        setAnnouncement(data);
        return api.get<User>(`/users/${data.authorId}`);
      })
      .then(({ data }) => setAuthor(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleContact() {
    if (!user?._id || !announcement?.authorId) return;
    setContacting(true);
    try {
      const { data } = await api.post<Conversation>('/conversations', {
        participants: [String(user._id), announcement.authorId],
      });
      navigate('/messages', { state: { conversationId: data.id } });
    } catch {
      setContacting(false);
    }
  }

  async function handleAccept(serviceDetails: ServiceDetails) {
    if (!announcement || !user || !id) return;
    setAccepting(true);
    setAcceptError(null);
    try {
      await api.post(`/announcements/${id}/accept`, { serviceDetails });

      const { data: contract } = await api.post<{ id: string }>('/documents/generate-contract', {
        announcementId: id,
      });

      navigate(`/services/${id}/contract`, {
        state: {
          announcementTitle: announcement.title,
          authorName: author ? `${author.firstName} ${author.lastName}` : 'Prestataire',
          acceptorName: `${user.firstName} ${user.lastName}`,
          documentId: contract.id,
          announcementId: id,
        },
      });
    } catch (err: any) {
      setAcceptError(err?.response?.data?.message ?? "Erreur lors de l'acceptation");
      setAccepting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="font-sans text-sable">Chargement du service...</p>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 p-8">
        <p className="font-sans text-charbon font-semibold">Service introuvable</p>
        <button onClick={() => navigate('/services')} className="text-vert-foret underline">
          Retour aux services
        </button>
      </div>
    );
  }

  const isOwner = String(user?._id) === announcement.authorId;
  const authorFullName = author ? `${author.firstName} ${author.lastName}` : '?';

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Header vert ── */}
      <div className="bg-vert-foret px-4 lg:px-8 pt-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/services')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-sans text-xs font-medium text-white">
            📋 {announcement.type === 'offer' ? 'Offre' : 'Demande'}
          </span>
          {isOwner && (
            <span className="flex items-center gap-1.5 rounded-full bg-ambre px-3 py-1 font-sans text-xs font-medium text-white">
              Mon annonce
            </span>
          )}
        </div>

        <h1 className="font-heading text-3xl font-bold text-white mb-1">{announcement.title}</h1>
        <p className="font-sans text-sm text-white/70 mb-4">
          {announcement.type === 'offer' ? "Offre d'aide" : "Demande d'aide"}
        </p>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-ambre px-3 py-1.5 font-sans text-sm font-bold text-white">
            ★ {announcement.points} points
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 font-sans text-sm font-semibold text-white capitalize">
            {announcement.status}
          </span>
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="flex flex-col gap-4 px-4 lg:px-8 py-6 pb-8">

        {/* Carte auteur */}
        <div className="rounded-2xl bg-white border border-sable/40 p-5">
          <p className="font-sans text-xs text-sable uppercase tracking-wide mb-3">Proposé par</p>
          <div className="flex items-center gap-4">
            <div className="flex h-10 items-center justify-center rounded-full bg-vert-foret font-sans text-xs font-bold text-white shrink-0 px-3">
              {authorFullName}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-base font-bold text-charbon">
                {author ? `${author.firstName} ${author.lastName}` : '—'}
              </p>
              {author && (
                <p className="font-sans text-xs text-sable capitalize">{author.role}</p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="rounded-2xl bg-white border border-sable/40 p-5">
          <h3 className="font-sans text-sm font-bold text-charbon mb-2">Description & Détails</h3>
          <p className="font-sans text-sm text-sable leading-relaxed whitespace-pre-wrap">
            {announcement.description}
          </p>
        </div>

        {/* Disponibilités */}
        {announcement.availabilities && announcement.availabilities.length > 0 && (
          <div className="rounded-2xl bg-white border border-sable/40 p-5 flex flex-col gap-3">
            <h3 className="font-sans text-sm font-bold text-charbon">Disponibilités du prestataire</h3>
            {announcement.availabilities.map((slot, i) => (
              <AvailabilityDisplay key={i} slot={slot} />
            ))}
          </div>
        )}

        {/* Notice contrat */}
        <div className="rounded-2xl bg-[#FFF8EE] border border-ambre/20 px-5 py-4 flex items-start gap-3">
          <span className="text-ambre mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <p className="font-sans text-xs text-charbon leading-relaxed">
            Un <span className="font-semibold">contrat de service</span> sera généré automatiquement et devra être signé numériquement par les deux parties.
          </p>
        </div>
      </div>

      {/* ── Boutons action ── */}
      <div className="sticky bottom-0 bg-white border-t border-sable/40 px-4 lg:px-8 py-4 flex flex-col gap-2">
        {acceptError && (
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl text-center">{acceptError}</p>
        )}
        <div className="flex gap-3">
          {isOwner ? (
            <div className="flex-1 flex items-center justify-center rounded-xl border border-sable/40 py-3 font-sans text-sm text-sable">
              En attente d'acceptation
            </div>
          ) : (
            <>
              <button
                onClick={handleContact}
                disabled={contacting || accepting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-vert-foret py-3 font-sans text-sm font-semibold text-vert-foret hover:bg-vert-foret hover:text-white transition-colors disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                </svg>
                {contacting ? 'En cours...' : 'Contacter'}
              </button>
              {announcement.status === 'open' && (
                <button
                  onClick={() => setShowAcceptModal(true)}
                  disabled={accepting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-vert-foret py-3 font-sans text-sm font-semibold text-white hover:bg-vert-moyen transition-colors disabled:opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {accepting ? 'Génération du contrat...' : "Accepter l'annonce"}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showAcceptModal && (
        <AcceptModal
          announcement={announcement}
          onClose={() => { if (!accepting) setShowAcceptModal(false); }}
          onConfirm={handleAccept}
          accepting={accepting}
          error={acceptError}
        />
      )}
    </div>
  );
}
