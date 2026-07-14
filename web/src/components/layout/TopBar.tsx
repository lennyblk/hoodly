import { useUser } from '../../contexts/useUser';

export default function TopBar() {
  const { user } = useUser();

  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const fullName = user ? `${user.firstName} ${user.lastName}` : '—';

  return (
    <header className="flex items-start justify-between px-8 pt-7 pb-2">
      <div>
        <p className="font-sans text-sm text-sable capitalize">{dateStr}</p>
        <h1 className="font-heading text-3xl font-bold text-charbon mt-0.5">
          Bonjour, {user?.firstName ?? '...'} 👋
        </h1>
      </div>

      <div className="flex items-center gap-3 mt-1">
        <div className="flex h-9 items-center justify-center rounded-full bg-ambre px-3">
          <span className="font-sans text-xs font-bold text-white">{fullName}</span>
        </div>
      </div>
    </header>
  );
}
