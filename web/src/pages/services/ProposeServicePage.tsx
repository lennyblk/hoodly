import { useState, useEffect } from 'react';

const MONTHS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
function fmtDate(iso: string): string {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const d = parseInt(parts[2], 10);
  const m = parseInt(parts[1], 10) - 1;
  return `${d} ${MONTHS_SHORT[m] ?? ''}`;
}
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../../contexts/useUser';
import api from '../../api/axios';
import type { components } from '../../api/types.generated';

type CreateAnnouncementDto = components['schemas']['CreateAnnouncementDto'];
type Announcement = components['schemas']['Announcement'];
type User = components['schemas']['User'];
type ServiceType = 'offer' | 'request';
type Location = 'moi' | 'beneficiaire' | 'flexible';

interface AvailabilitySlot {
  date: string;
  startTime: string;
  endTime: string;
}

interface AnnouncementWithAvail extends Omit<Announcement, 'availabilities'> {
  duration?: string;
  availabilities?: Partial<AvailabilitySlot>[];
}

function parseEnrichedDescription(raw: string) {
  const match = raw.match(/^([\s\S]*)\n\n📍 Catégorie: (.*)\n⏱ Durée: (.*)\n📅 Dispo: .*\n🏠 Lieu: (.*)$/);
  if (!match) return { description: raw, category: '', duration: '', location: 'flexible' as Location };
  const [, description, category, duration, location] = match;
  const validLocation: Location = ['moi', 'beneficiaire', 'flexible'].includes(location) ? (location as Location) : 'flexible';
  return { description, category, duration, location: validLocation };
}

const CATEGORIES = [
  { label: 'Jardinage', emoji: '🌱' },
  { label: 'Bricolage', emoji: '🔧' },
  { label: 'Cours', emoji: '📚' },
  { label: 'Baby-sitting', emoji: '👶' },
  { label: 'Cuisine', emoji: '🍳' },
  { label: 'Informatique', emoji: '💻' },
  { label: 'Transport', emoji: '🚗' },
  { label: 'Autre', emoji: '✨' },
];

const DURATION_REGEX = /^(\d+(?:\.\d+)?)\s*(minutes?|heures?|min|h)$/i;

function isDurationValid(duration: string): boolean {
  const match = duration.trim().match(DURATION_REGEX);
  return !!match && parseFloat(match[1]) > 0;
}

function isTimeRangeValid(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return true;
  // endTime === startTime reste invalide (durée nulle). endTime < startTime
  // veut dire que le créneau passe minuit (ex: 23:00 -> 00:15), donc valide.
  return endTime !== startTime;
}

function parseDurationMinutes(duration: string): number | null {
  const match = duration.trim().match(DURATION_REGEX);
  if (!match) return null;
  const value = parseFloat(match[1]);
  return match[2].toLowerCase().startsWith('h') ? value * 60 : value;
}

function windowMinutes(startTime: string, endTime: string): number | null {
  if (!startTime || !endTime) return null;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  // diff < 0 veut dire que le créneau passe minuit, on rallonge à +24h.
  return diff < 0 ? diff + 24 * 60 : diff;
}

function matchesDuration(duration: string, startTime: string, endTime: string): boolean {
  const durationMinutes = parseDurationMinutes(duration);
  const window = windowMinutes(startTime, endTime);
  if (durationMinutes === null || window === null) return true;
  return window === durationMinutes;
}

interface FormState {
  type: ServiceType;
  category: string;
  title: string;
  description: string;
  duration: string;
  points: number;
  location: Location;
  // availability
  slots: AvailabilitySlot[];
}

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex gap-1.5 mb-6">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className={`h-1 flex-1 rounded-full transition-colors ${n <= current ? 'bg-vert-foret' : 'bg-sable/40'
            }`}
        />
      ))}
    </div>
  );
}

export default function ProposeServicePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;
  const { user } = useUser() as { user: User | null };
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);

  const [form, setForm] = useState<FormState>({
    type: 'offer',
    category: '',
    title: '',
    description: '',
    duration: '',
    points: 0,
    location: 'flexible',
    slots: [],
  });
  const [draftSlot, setDraftSlot] = useState<AvailabilitySlot>({ date: '', startTime: '', endTime: '' });

  useEffect(() => {
    if (!id) return;
    setLoadingExisting(true);
    api.get<AnnouncementWithAvail>(`/announcements/${id}`)
      .then(({ data }) => {
        const { description, category, duration, location } = parseEnrichedDescription(data.description);
        const slots = (data.availabilities ?? [])
          .filter((s): s is AvailabilitySlot => !!s.date && !!s.startTime && !!s.endTime);
        setForm((f) => ({
          ...f,
          type: data.type,
          category,
          title: data.title,
          description,
          duration: (data as AnnouncementWithAvail).duration ?? duration,
          points: data.points,
          location,
          slots,
        }));
      })
      .catch(() => setSubmitError("Impossible de charger l'annonce à modifier."))
      .finally(() => setLoadingExisting(false));
  }, [id]);

  const handleSubmit = async () => {
    if (!user?._id) return;
    setSubmitError(null);

    if (!user.neighbourhoodId) {
      navigate('/select-neighbourhood', { state: { from: '/services/new' } });
      return;
    }

    const availabilityLabel = form.slots
      .map((s) => `${s.date} de ${s.startTime} à ${s.endTime}`)
      .join(' ; ');

    const enrichedDescription = `${form.description}\n\n📍 Catégorie: ${form.category}\n⏱ Durée: ${form.duration}\n📅 Dispo: ${availabilityLabel}\n🏠 Lieu: ${form.location}`;

    setSubmitting(true);
    try {
      if (isEditMode) {
        await api.patch(`/announcements/${id}/mine`, {
          title: form.title,
          description: enrichedDescription,
          duration: form.duration,
          type: form.type,
          isPaid: form.points > 0,
          points: form.points,
          availabilities: form.slots,
        });
        navigate(`/services/${id}`);
      } else {
        const payload: CreateAnnouncementDto = {
          title: form.title,
          description: enrichedDescription,
          duration: form.duration,
          type: form.type,
          isPaid: form.points > 0,
          points: form.points,
          authorId: String(user._id),
          neighbourhoodId: String(user.neighbourhoodId),
          status: 'open',
          availabilities: form.slots,
        } as any;
        await api.post('/announcements', payload);
        navigate('/services');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setSubmitError(Array.isArray(msg) ? msg[0] : (msg ?? `Erreur lors de la ${isEditMode ? 'modification' : 'création'} de l'annonce.`));
    } finally {
      setSubmitting(false);
    }
  };

  const draftComplete = !!draftSlot.date && !!draftSlot.startTime && !!draftSlot.endTime;
  const draftValid =
    draftComplete &&
    isTimeRangeValid(draftSlot.startTime, draftSlot.endTime) &&
    matchesDuration(form.duration, draftSlot.startTime, draftSlot.endTime) &&
    !form.slots.some((s) => s.date === draftSlot.date && s.startTime === draftSlot.startTime);

  function addSlot() {
    if (!draftValid) return;
    setForm((f) => ({
      ...f,
      slots: [...f.slots, draftSlot].sort((a, b) =>
        `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`),
      ),
    }));
    setDraftSlot({ date: '', startTime: '', endTime: '' });
  }

  function removeSlot(slot: AvailabilitySlot) {
    setForm((f) => ({
      ...f,
      slots: f.slots.filter((s) => !(s.date === slot.date && s.startTime === slot.startTime && s.endTime === slot.endTime)),
    }));
  }

  const stepLabels = [
    'Étape 1/3 — Type & Catégorie',
    'Étape 2/3 — Détails',
    'Étape 3/3 — Disponibilités',
  ];

  const inputClass = 'w-full rounded-xl border border-sable bg-white px-4 py-3 font-sans text-sm text-charbon outline-none placeholder:text-sable focus:border-vert-moyen';
  const selectedCat = CATEGORIES.find((c) => c.label === form.category);

  return (
    <div className="flex flex-col min-h-full">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between px-4 lg:px-8 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (step > 1 ? setStep((s) => (s - 1) as 1 | 2 | 3) : navigate('/services'))}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-sable bg-white text-charbon hover:bg-creme transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h1 className="font-heading text-xl font-bold text-charbon">{isEditMode ? 'Modifier le service' : 'Proposer un service'}</h1>
            <p className="font-sans text-xs text-sable">{stepLabels[step - 1]}</p>
          </div>
        </div>
      </div>

      {/* ── Contenu centré ── */}
      <div className="flex-1 flex justify-center px-4 lg:px-8 py-4">
        <div className="w-full max-w-[720px]">
          {loadingExisting ? (
            <p className="font-sans text-sm text-sable text-center py-16">Chargement de l'annonce...</p>
          ) : (
            <>
          <StepBar current={step} />

          {/* ── Étape 1 ── */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-sans text-sm font-bold text-charbon mb-3">Type de service</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'offer' as ServiceType, emoji: '🤝', title: 'J\'offre', sub: 'Je peux aider mes voisins' },
                    { value: 'request' as ServiceType, emoji: '🙋', title: 'Je demande', sub: "J'ai besoin d'aide" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setForm((f) => ({ ...f, type: opt.value }))}
                      className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-6 transition-colors ${form.type === opt.value
                        ? 'border-vert-foret bg-[#E8F5EE]'
                        : 'border-sable/50 bg-white hover:border-sable'
                        }`}
                    >
                      <span className="text-3xl">{opt.emoji}</span>
                      <span className="font-sans text-sm font-bold text-charbon">{opt.title}</span>
                      <span className="font-sans text-xs text-sable text-center">{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-sans text-sm font-bold text-charbon mb-3">Catégorie</h2>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.label}
                      onClick={() => setForm((f) => ({ ...f, category: cat.label }))}
                      className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 px-2 py-4 transition-colors ${form.category === cat.label
                        ? 'border-vert-foret bg-[#E8F5EE]'
                        : 'border-sable/50 bg-white hover:border-sable'
                        }`}
                    >
                      {form.category === cat.label && (
                        <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-vert-foret text-white text-[10px]">✓</span>
                      )}
                      <span className="text-2xl">{cat.emoji}</span>
                      <span className="font-sans text-xs font-medium text-charbon text-center">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={!form.category}
                onClick={() => setStep(2)}
                className="w-full rounded-xl bg-vert-foret py-3.5 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuer →
              </button>
            </div>
          )}

          {/* ── Étape 2 ── */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div className="rounded-xl bg-[#E8F5EE] border border-vert-foret/20 px-4 py-3">
                <p className="font-sans text-sm font-semibold text-vert-foret">
                  {form.type === 'offer' ? '🤝 Détails de votre offre de service' : "🙋 Détails de votre demande d'aide"}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-sm font-semibold text-charbon">
                  {form.type === 'offer' ? "Titre de l'offre" : 'Titre de la demande'}
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder={form.type === 'offer' ? 'Cours de guitare acoustique — tous niveaux' : "Recherche aide pour cours de guitare"}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-sm font-semibold text-charbon">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder={form.type === 'offer' ? 'Je propose des cours de guitare acoustique pour débutants et intermédiaires...' : "Je cherche quelqu'un pour m'apprendre la guitare acoustique..."}
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-sm font-semibold text-charbon">Durée d'une séance</label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                    placeholder="30 minutes"
                    className={inputClass}
                  />
                  {form.duration && !isDurationValid(form.duration) && (
                    <p className="font-sans text-xs text-red-600">
                      Valeur numérique positive suivie d'une unité (ex. « 30 minutes », « 2 heures »)
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-sm font-semibold text-charbon">Points (montant fixe)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={form.points}
                      onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))}
                      className={`${inputClass} pr-10`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-sans text-xs text-ambre font-semibold">pts</span>
                  </div>
                </div>
              </div>

              {/* Info système de points */}
              <div className="rounded-xl bg-[#FFF8EE] border border-ambre/20 px-4 py-3">
                <p className="font-sans text-xs font-semibold text-ambre mb-1">💡 Système de points</p>
                <p className="font-sans text-xs text-charbon leading-relaxed">
                  Mettez <span className="font-semibold">0 points</span> pour un service gratuit.{' '}
                  {form.type === 'offer'
                    ? 'Les points sont débités du compte du bénéficiaire et crédités sur le vôtre.'
                    : 'Les points seront débités de votre compte et crédités sur celui de la personne qui vous aide.'}
                  {' '}Un contrat est généré automatiquement.
                </p>
              </div>

              {/* Aperçu */}
              {(form.title || selectedCat) && (
                <div>
                  <p className="font-sans text-sm font-semibold text-charbon mb-2">Aperçu de votre annonce</p>
                  <div className="rounded-2xl overflow-hidden border border-sable/40 max-w-[260px]">
                    <div className="bg-[#E8F5EE] px-4 pt-4 pb-3 flex flex-col gap-2">
                      <span className="text-2xl">{selectedCat?.emoji ?? '📋'}</span>
                      <span className="flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 w-fit font-sans text-xs font-semibold text-ambre">
                        ★ {form.points} pts
                      </span>
                    </div>
                    <div className="bg-white px-4 py-3">
                      <p className="font-sans text-sm font-semibold text-charbon truncate">{form.title || 'Titre de votre annonce'}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="font-sans text-xs text-sable">
                          {user?.firstName || 'Utilisateur'} {user?.lastName || ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                disabled={!form.title || !isDurationValid(form.duration)}
                onClick={() => setStep(3)}
                className="w-full rounded-xl bg-vert-foret py-3.5 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuer →
              </button>
            </div>
          )}

          {/* ── Étape 3 ── */}
          {step === 3 && (
            <div className="flex flex-col gap-5">

              {/* Disponibilités : une date + un créneau horaire chacune */}
              <div className="flex flex-col gap-2">
                <label className="font-sans text-sm font-semibold text-charbon">Ajouter une disponibilité</label>
                <p className="font-sans text-xs text-sable">Chaque disponibilité correspond à une date avec son créneau horaire. Vous pouvez en proposer plusieurs.</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-xs font-semibold text-charbon">Date</label>
                    <input type="date" value={draftSlot.date} min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDraftSlot((s) => ({ ...s, date: e.target.value }))} className={inputClass} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-xs font-semibold text-charbon">Heure de début</label>
                    <input type="time" value={draftSlot.startTime}
                      onChange={(e) => setDraftSlot((s) => ({ ...s, startTime: e.target.value }))} className={inputClass} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-xs font-semibold text-charbon">Heure de fin</label>
                    <input type="time" value={draftSlot.endTime}
                      onChange={(e) => setDraftSlot((s) => ({ ...s, endTime: e.target.value }))} className={inputClass} />
                  </div>
                </div>
                {!isTimeRangeValid(draftSlot.startTime, draftSlot.endTime) && (
                  <p className="font-sans text-xs text-red-600">L'heure de fin doit être postérieure à l'heure de début</p>
                )}
                {isTimeRangeValid(draftSlot.startTime, draftSlot.endTime) && !matchesDuration(form.duration, draftSlot.startTime, draftSlot.endTime) && (
                  <p className="font-sans text-xs text-red-600">
                    La plage horaire ({windowMinutes(draftSlot.startTime, draftSlot.endTime)} min) doit correspondre à la durée de la séance ({parseDurationMinutes(form.duration)} min)
                  </p>
                )}
                <button
                  type="button"
                  onClick={addSlot}
                  disabled={!draftValid}
                  className="self-start px-4 py-2 bg-vert-foret text-white rounded-xl text-sm font-semibold hover:bg-vert-moyen disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Ajouter cette disponibilité
                </button>
              </div>

              {form.slots.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="font-sans text-sm font-semibold text-charbon">Disponibilités proposées</label>
                  <div className="flex flex-wrap gap-2">
                    {form.slots.map((s) => (
                      <span key={`${s.date}-${s.startTime}`} className="flex items-center gap-1.5 bg-vert-foret/10 text-vert-foret rounded-full px-3 py-1.5 text-xs font-medium">
                        {fmtDate(s.date)} · {s.startTime}–{s.endTime}
                        <button onClick={() => removeSlot(s)} className="text-vert-foret/60 hover:text-red-500">✕</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Lieu */}
              <div>
                <label className="font-sans text-sm font-semibold text-charbon mb-3 block">Lieu</label>
                <div className="flex gap-2">
                  {[
                    { value: 'moi' as Location, label: 'À mon domicile' },
                    { value: 'beneficiaire' as Location, label: 'Au domicile du bénéficiaire' },
                    { value: 'flexible' as Location, label: 'Flexible' },
                  ].map((opt) => (
                    <button key={opt.value} onClick={() => setForm((f) => ({ ...f, location: opt.value }))}
                      className={`flex-1 rounded-xl px-3 py-3 font-sans text-sm font-medium transition-colors ${form.location === opt.value ? 'bg-vert-foret text-white' : 'border border-sable bg-white text-charbon hover:border-vert-moyen'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {submitError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <p className="font-sans text-sm text-red-600">{submitError}</p>
                </div>
              )}
              <button
                disabled={
                  submitting ||
                  !isDurationValid(form.duration) ||
                  form.slots.length === 0 ||
                  form.slots.some((s) => !isTimeRangeValid(s.startTime, s.endTime) || !matchesDuration(form.duration, s.startTime, s.endTime))
                }
                onClick={handleSubmit}
                className="w-full rounded-xl bg-vert-foret py-3.5 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? (isEditMode ? 'Enregistrement...' : 'Publication...')
                  : (isEditMode ? 'Enregistrer les modifications →' : "Publier l'annonce →")}
              </button>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
