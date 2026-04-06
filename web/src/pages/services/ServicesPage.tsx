import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import type { components } from '../../api/types.generated';

type Announcement = components['schemas']['Announcement'];
type ServiceTab = 'offer' | 'request';

const CATEGORIES = [
  { label: 'Tous', emoji: '🏠' },
  { label: 'Jardinage', emoji: '🌱' },
  { label: 'Bricolage', emoji: '🔧' },
  { label: 'Cours', emoji: '📚' },
  { label: 'Baby-sitting', emoji: '👶' },
  { label: 'Cuisine', emoji: '🍳' },
  { label: 'Info', emoji: '💻' },
];

export default function ServicesPage() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<ServiceTab>('offer');
  const [category, setCategory] = useState('Tous');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/announcements');

        console.log('Réponse de l\'API /announcements:', response.data);

        if (Array.isArray(response.data)) {
          setAnnouncements(response.data);
        } else if (response.data && Array.isArray(response.data.data)) {
          setAnnouncements(response.data.data);
        } else {
          console.warn("Format de données inattendu", response.data);
          setAnnouncements([]);
        }

      } catch (error) {
        console.error("Erreur lors du chargement des annonces", error);
        setAnnouncements([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const offresCount = announcements.filter((a) => a.type === 'offer').length;
  const demandesCount = announcements.filter((a) => a.type === 'request').length;

  const filtered = announcements.filter((a) => {
    if (a.type !== tab) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    // code
    return true;
  });

  return (
    <div className="flex flex-col min-h-full">

      {/* ── En-tête ── */}
      <div className="flex items-start justify-between px-4 lg:px-8 pt-7 pb-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-charbon">Services</h1>
          <p className="mt-0.5 font-sans text-sm text-sable">
            {offresCount + demandesCount} annonces disponibles
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => navigate('/services/new')}
            className="flex items-center gap-2 rounded-xl bg-vert-foret px-4 py-2 font-sans text-sm font-semibold text-white hover:bg-vert-moyen transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Proposer
          </button>
        </div>
      </div>

      <div className="px-4 lg:px-8 flex flex-col gap-4 pb-8">

        {/* ── Barre de recherche ── */}
        <div className="flex items-center gap-3 rounded-2xl border border-sable bg-white px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-sable shrink-0">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un service..."
            className="flex-1 bg-transparent font-sans text-sm text-charbon outline-none placeholder:text-sable"
          />
          <button className="text-sable hover:text-charbon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Tabs Offres / Demandes ── */}
        <div className="flex rounded-2xl border border-sable bg-white p-1 gap-1">
          <button
            onClick={() => setTab('offer')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-sans text-sm font-semibold transition-colors ${tab === 'offer'
              ? 'bg-vert-foret text-white'
              : 'text-sable hover:text-charbon'
              }`}
          >
            Offres ({offresCount})
          </button>
          <button
            onClick={() => setTab('request')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-sans text-sm font-semibold transition-colors ${tab === 'request'
              ? 'bg-vert-foret text-white'
              : 'text-sable hover:text-charbon'
              }`}
          >
            Demandes ({demandesCount})
          </button>
        </div>

        {/* ── Filtres catégorie ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setCategory(cat.label)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 font-sans text-sm font-medium transition-colors ${category === cat.label
                ? 'bg-vert-foret text-white'
                : 'bg-white border border-sable text-charbon hover:border-vert-moyen'
                }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── Grille de cartes ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-sans text-sable">Chargement des services en cours...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-sans text-sable">Aucun service trouvé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {filtered.map((announcement) => (
              <button
                key={announcement.id}
                onClick={() => navigate(`/services/${announcement.id}`)}
                className="flex flex-col rounded-2xl overflow-hidden bg-white border border-sable/40 hover:shadow-md transition-shadow text-left"
              >
                {/* Top — couleur + icône */}
                <div className="relative flex flex-col items-start justify-end bg-[#E8F5EE] px-4 pt-5 pb-3 min-h-[110px]">
                  <span className="text-3xl mb-2">📋</span>
                  <span className="flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 font-sans text-xs font-semibold text-ambre">
                    ★ {announcement.points} pts
                  </span>
                </div>

                {/* Bottom — infos */}
                <div className="flex flex-col gap-2 px-4 py-3">
                  <p className="font-sans text-sm font-semibold text-charbon leading-tight">{announcement.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full font-sans text-[9px] font-bold text-white shrink-0 bg-vert-foret">
                      U
                    </span>
                    {/* Fallback car authorId n'est pas encore peuplé avec le firstName/lastName par le backend */}
                    <span className="font-sans text-xs text-sable truncate">Auteur ID: {announcement.authorId.substring(0, 5)}...</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
