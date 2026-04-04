import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';

interface Props {
  children: React.ReactNode;
}

export default function AppLayout({ children }: Props) {
  return (
    <div className="flex h-full bg-creme">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
