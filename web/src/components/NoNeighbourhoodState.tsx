export default function NoNeighbourhoodState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-creme text-center px-6">
      <span className="text-5xl mb-4">🏘️</span>
      <p className="font-medium text-charbon/60">Aucun quartier assigné</p>
      <p className="text-sm text-charbon/40 mt-1">
        {message ?? 'Rejoins un quartier pour accéder à cette page'}
      </p>
    </div>
  );
}
