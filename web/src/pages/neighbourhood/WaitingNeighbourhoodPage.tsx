import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/useUser';

export default function WaitingNeighbourhoodPage() {
  const navigate = useNavigate();
  const { user } = useUser();

  return (
    <div className="flex h-full w-full items-center justify-center bg-creme px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-ambre/10">
          <span className="text-3xl">🏘️</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-charbon mb-3">En attente d'un quartier</h1>
        <p className="font-sans text-sm text-charbon/70 leading-relaxed mb-6">
          Ton adresse ne correspond à aucun quartier disponible pour le moment. Ta demande a bien été prise en
          compte ! Notre équipe va étudier la possibilité d'ouvrir un quartier pour ton adresse. Tu seras notifié
          quand ce sera fait.
        </p>
        {user?.address && (
          <p className="font-sans text-xs text-sable mb-6">
            Adresse enregistrée : <span className="font-medium text-charbon/60">{user.address}</span>
          </p>
        )}
        <button
          onClick={() => navigate('/profile')}
          className="w-full rounded-xl bg-vert-foret py-3 font-sans text-sm font-semibold text-white hover:bg-vert-moyen transition-colors"
        >
          Voir mon profil
        </button>
      </div>
    </div>
  );
}
