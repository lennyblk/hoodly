interface Props {
  icon: React.ReactNode;
  value: number;
  label: string;
  bg: string;
  iconBg: string;
}

export default function StatCard({ icon, value, label, bg, iconBg }: Props) {
  return (
    <div className={`flex flex-col gap-3 rounded-2xl p-5 ${bg}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="font-heading text-3xl font-bold text-charbon">{value}</p>
        <p className="font-sans text-sm text-charbon/60 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
