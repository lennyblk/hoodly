const items = [
  { name: 'Marc Dupont', sub: 'Aide jardinage', badge: '3 pts/h', badgeColor: 'bg-ambre', icon: '🌿' },
  { name: 'Sophie Martin', sub: "Garde d'enfants", badge: '4 pts/h', badgeColor: 'bg-[#7C3AED]', icon: '❤️' },
  { name: 'Atelier vélo', sub: 'Samedi 14h', badge: 'Gratuit', badgeColor: 'bg-vert-moyen', icon: '🚲' },
];

export default function RecommendedSection() {
  return (
    <div className="flex flex-col rounded-2xl bg-charbon overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-5 pb-4">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-vert-clair">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2" />
        </svg>
        <span className="font-sans text-xs font-bold tracking-widest text-vert-clair uppercase">Recommandé — Neo4J</span>
      </div>

      <div className="flex flex-col px-3 pb-4 gap-1">
        {items.map((item) => (
          <div key={item.name} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/5 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-base shrink-0">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-semibold text-white truncate">{item.name}</p>
              <p className="font-sans text-xs text-white/50 truncate">{item.sub}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 font-sans text-xs font-bold text-white ${item.badgeColor}`}>
              {item.badge}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
