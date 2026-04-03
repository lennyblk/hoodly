import { useUser } from '../../contexts/UserContext';

export default function TopBar() {
  const { user } = useUser();

  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : '?';

  return (
    <header className="flex items-start justify-between px-8 pt-7 pb-2">
      <div>
        <p className="font-sans text-sm text-sable capitalize">{dateStr}</p>
        <h1 className="font-heading text-3xl font-bold text-charbon mt-0.5">
          Bonjour, {user?.firstName ?? '...'} 👋
        </h1>
      </div>

      <div className="flex items-center gap-3 mt-1">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-sable bg-white text-charbon hover:bg-creme transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ambre">
          <span className="font-sans text-xs font-bold text-white">{initials}</span>
        </div>
      </div>
    </header>
  );
}
