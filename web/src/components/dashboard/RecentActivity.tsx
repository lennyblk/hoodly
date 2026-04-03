const activities = [
  { text: 'Claire B. propose un cours de guitare', time: 'il y a 5 min', dot: 'bg-ambre' },
  { text: 'Vote ouvert : bancs dans le parc', time: 'il y a 12 min', dot: 'bg-[#F4A261]' },
  { text: 'Marc D. a signé le contrat de service', time: 'il y a 1h', dot: 'bg-vert-clair' },
  { text: 'Nouveau voisin dans le quartier', time: 'il y a 2h', dot: 'bg-[#7C3AED]' },
];

export default function RecentActivity() {
  return (
    <div className="flex flex-col rounded-2xl bg-white border border-sable/40 overflow-hidden">
      <div className="px-5 py-4 border-b border-sable/30">
        <h3 className="font-sans text-sm font-bold text-charbon">Activité récente</h3>
      </div>

      <div className="flex flex-col divide-y divide-sable/20">
        {activities.map((a) => (
          <div key={a.text} className="flex items-start gap-3 px-5 py-3.5">
            <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${a.dot}`} />
            <div>
              <p className="font-sans text-sm text-charbon leading-snug">{a.text}</p>
              <p className="font-sans text-xs text-sable mt-0.5">{a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
