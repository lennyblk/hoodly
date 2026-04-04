import { useUser } from '../../contexts/UserContext';

type NavItem = {
  label: string;
  badge?: number;
  active?: boolean;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    label: 'Tableau de bord',
    active: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15" />
        <path d="M9 21V13h6v8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Carte du quartier',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    label: 'Services',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M20.42 4.58a5.4 5.4 0 00-7.65 0l-.77.78-.77-.78a5.4 5.4 0 00-7.65 7.65l8.42 8.42 8.42-8.42a5.4 5.4 0 000-7.65z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Événements',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Messages',
    badge: 3,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Votes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Documents',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Mon profil',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Administration',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { user } = useUser();

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : '?';

  return (
    <aside className="hidden lg:flex flex-col w-[210px] shrink-0 bg-vert-foret h-full">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ambre shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="#1E4D35" strokeWidth="2" strokeLinejoin="round" fill="#F8F4ED" />
            <path d="M9 21V12h6v9" stroke="#1E4D35" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p className="font-sans text-sm font-bold text-white leading-tight">Connected</p>
          <p className="font-sans text-xs text-vert-clair/70">Neighbours</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors ${item.active
                ? 'bg-ambre text-white font-semibold'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="font-sans text-sm flex-1">{item.label}</span>
            {item.badge && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ambre px-1.5 font-sans text-[10px] font-bold text-white">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/10 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ambre shrink-0">
          <span className="font-sans text-xs font-bold text-white">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans text-sm font-semibold text-white truncate">
            {user ? `${user.firstName} ${user.lastName}` : '—'}
          </p>
          <p className="font-sans text-xs text-vert-clair/70 truncate">
            {user ? `${user.points} pts · ${user.role}` : '—'}
          </p>
        </div>
        <button className="text-white/50 hover:text-white shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
