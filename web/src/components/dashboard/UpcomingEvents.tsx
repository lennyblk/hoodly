const events = [
  { title: 'Soirée de quartier', date: 'Sam. 22 mars', attendees: 23, color: 'bg-[#E8E4F7]', iconColor: 'text-[#7C3AED]' },
  { title: 'Collecte alimentaire', date: 'Dim. 23 mars', attendees: 14, color: 'bg-[#FDE8D8]', iconColor: 'text-ambre' },
  { title: 'Atelier jardinage', date: 'Mer. 26 mars', attendees: 8, color: 'bg-[#D8F3DC]', iconColor: 'text-vert-moyen' },
];

export default function UpcomingEvents() {
  return (
    <div className="flex flex-col rounded-2xl bg-white border border-sable/40 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-sable/30">
        <h3 className="font-sans text-sm font-bold text-charbon">Événements à venir</h3>
        <button className="flex items-center gap-1 font-sans text-xs font-semibold text-vert-moyen hover:underline">
          Voir tout
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col divide-y divide-sable/20">
        {events.map((event) => (
          <div key={event.title} className="flex items-center gap-4 px-5 py-3.5 hover:bg-creme transition-colors">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${event.color}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={event.iconColor}>
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-semibold text-charbon truncate">{event.title}</p>
              <p className="font-sans text-xs text-sable">{event.date} · {event.attendees} inscrits</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
