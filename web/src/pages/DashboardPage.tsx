import TopBar from '../components/layout/TopBar';
import { useUser } from '../contexts/UserContext';
import NeighbourhoodBanner from '../components/dashboard/NeighbourhoodBanner';
import StatCard from '../components/dashboard/StatCard';
import QuickActionCard from '../components/dashboard/QuickActionCard';
import RecommendedSection from '../components/dashboard/RecommendedSection';
import UpcomingEvents from '../components/dashboard/UpcomingEvents';
import RecentActivity from '../components/dashboard/RecentActivity';

const stats = [
  {
    value: 143,
    label: 'Voisins actifs',
    bg: 'bg-[#D8F3DC]',
    iconBg: 'bg-[#B7E4C7]',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-vert-moyen">
        <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
        <path d="M2 20c0-3.31 3.13-6 7-6s7 2.69 7 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="17" cy="7" r="2" stroke="currentColor" strokeWidth="2" />
        <path d="M22 20c0-2.76-2.24-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 28,
    label: 'Services dispo.',
    bg: 'bg-[#FDE8D8]',
    iconBg: 'bg-[#FBBF9E]',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-ambre">
        <path d="M20.42 4.58a5.4 5.4 0 00-7.65 0l-.77.78-.77-.78a5.4 5.4 0 00-7.65 7.65l8.42 8.42 8.42-8.42a5.4 5.4 0 000-7.65z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: 5,
    label: 'Événements',
    bg: 'bg-[#E8E4F7]',
    iconBg: 'bg-[#C4B8F0]',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#7C3AED]">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 127,
    label: 'Mes points',
    bg: 'bg-[#FDF6C3]',
    iconBg: 'bg-[#F9E784]',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#B45309]">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const quickActions = [
  {
    label: 'Proposer un service',
    iconBg: 'bg-[#FDE8D8]',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-ambre">
        <path d="M20.42 4.58a5.4 5.4 0 00-7.65 0l-.77.78-.77-.78a5.4 5.4 0 00-7.65 7.65l8.42 8.42 8.42-8.42a5.4 5.4 0 000-7.65z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Créer un événement',
    iconBg: 'bg-[#E8E4F7]',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#7C3AED]">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Carte du quartier',
    iconBg: 'bg-[#D8F3DC]',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-vert-moyen">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    label: 'Nouveau vote',
    iconBg: 'bg-[#DBEAFE]',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#2563EB]">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  const { user } = useUser();

  const statsWithUser = stats.map((s) =>
    s.label === 'Mes points' ? { ...s, value: user?.points ?? 0 } : s
  );

  return (
    <div className="flex flex-col h-full">
      <TopBar />

      <div className="flex flex-col gap-6 px-4 lg:px-8 pb-8">
        <NeighbourhoodBanner />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {statsWithUser.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="font-sans text-base font-bold text-charbon mb-3">Actions rapides</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {quickActions.map((a) => (
              <QuickActionCard key={a.label} {...a} />
            ))}
          </div>
        </div>

        {/* Bottom 3-col section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <RecommendedSection />
          <UpcomingEvents />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
