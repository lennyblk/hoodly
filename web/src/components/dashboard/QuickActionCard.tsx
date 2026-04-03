interface Props {
  icon: React.ReactNode;
  label: string;
  iconBg: string;
}

export default function QuickActionCard({ icon, label, iconBg }: Props) {
  return (
    <button className="flex flex-col gap-3 rounded-2xl bg-white border border-sable/40 p-5 text-left hover:border-sable transition-colors w-full">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <p className="font-sans text-sm font-semibold text-charbon">{label}</p>
    </button>
  );
}
