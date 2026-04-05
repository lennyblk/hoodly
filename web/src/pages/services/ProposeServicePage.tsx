import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import api from 'axios';
import type { components } from '../../api/types.generated';

type CreateAnnouncementDto = components['schemas']['CreateAnnouncementDto'];
type User = components['schemas']['User'];
type ServiceType = 'offer' | 'request';
type Location = 'moi' | 'beneficiaire' | 'flexible';

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

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface FormState {
  type: ServiceType;
  category: string;
  title: string;
  description: string;
  duration: string;
  points: number;
  days: string[];
  startTime: string;
  endTime: string;
  location: Location;
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
  const { user } = useUser() as { user: User | null };
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormState>({
    type: 'offer',
    category: '',
    title: '',
    description: '',
    duration: '',
    points: 0,
    days: [],
    startTime: '',
    endTime: '',
    location: 'flexible',
  });

  const handleSubmit = async () => {
    if (!user?._id || !user?.neighbourhoodId) {
      console.error("Utilisateur ou quartier manquant");
      return;
    }

    // Le backend n'a pas encore de champs dédiés pour la catégorie, les horaires, etc.
    // On les intègre donc joliment dans la description pour l'instant.
    const enrichedDescription = `${form.description}\n\n📍 Catégorie: ${form.category}\n⏱ Durée: ${form.duration}\n📅 Dispo: ${form.days.join(', ')} de ${form.startTime} à ${form.endTime}\n🏠 Lieu: ${form.location}`;

    const payload: CreateAnnouncementDto = {
      title: form.title,
      description: enrichedDescription,
      type: form.type,
      isPaid: form.points > 0,
      points: form.points,
      authorId: user._id,
      neighbourhoodId: user.neighbourhoodId,
      status: 'open',
    };

    try {
      await api.post('/announcements', payload);
      navigate('/services');
    } catch (error) {
      console.error("Erreur lors de la création de l'annonce", error);
    }
  };

  function toggleDay(day: string) {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
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
            <h1 className="font-heading text-xl font-bold text-charbon">Proposer un service</h1>
            <p className="font-sans text-xs text-sable">{stepLabels[step - 1]}</p>
          </div>
        </div>
      </div>

      {/* ── Contenu centré ── */}
      <div className="flex-1 flex justify-center px-4 lg:px-8 py-4">
        <div className="w-full max-w-[720px]">
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
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-sm font-semibold text-charbon">Titre de l'annonce</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Cours de guitare acoustique — tous niveaux"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-sm font-semibold text-charbon">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Je propose des cours de guitare acoustique pour débutants et intermédiaires..."
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
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-sm font-semibold text-charbon">Points / heure</label>
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
                  Mettez <span className="font-semibold">0 points</span> pour un service gratuit. Les points sont débités du compte du bénéficiaire et crédités sur le vôtre. Un contrat est généré automatiquement.
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
                        ★ {form.points} pts/h
                      </span>
                    </div>
                    <div className="bg-white px-4 py-3">
                      <p className="font-sans text-sm font-semibold text-charbon truncate">{form.title || 'Titre de votre annonce'}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="font-sans text-xs text-sable">
                          {user?.firstName || 'Utilisateur'} {user?.lastName?.charAt(0) || ''}.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                disabled={!form.title}
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
              <div>
                <label className="font-sans text-sm font-semibold text-charbon mb-3 block">Jours disponibles</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`rounded-xl px-4 py-2 font-sans text-sm font-medium transition-colors ${form.days.includes(day)
                        ? 'bg-vert-foret text-white'
                        : 'border border-sable bg-white text-charbon hover:border-vert-moyen'
                        }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-sm font-semibold text-charbon">Heure de début</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-sm font-semibold text-charbon">Heure de fin</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="font-sans text-sm font-semibold text-charbon mb-3 block">Lieu</label>
                <div className="flex gap-2">
                  {[
                    { value: 'moi' as Location, label: 'À mon domicile' },
                    { value: 'beneficiaire' as Location, label: 'Au domicile du bénéficiaire' },
                    { value: 'flexible' as Location, label: 'Flexible' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setForm((f) => ({ ...f, location: opt.value }))}
                      className={`flex-1 rounded-xl px-3 py-3 font-sans text-sm font-medium transition-colors ${form.location === opt.value
                        ? 'bg-vert-foret text-white'
                        : 'border border-sable bg-white text-charbon hover:border-vert-moyen'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={form.days.length === 0}
                onClick={handleSubmit}
                className="w-full rounded-xl bg-vert-foret py-3.5 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Publier l'annonce →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
