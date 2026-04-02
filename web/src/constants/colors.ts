// Palette de couleurs — Hoodly

export const colors = {
  // Verts
  vertForet: '#1E4D35',    // Primaire — sidebar, headers
  vertMoyen: '#2D6A4F',    // Secondaire — hover, variantes
  vertClair: '#52B788',    // Accent — badges, indicateurs actifs

  // Ambre
  ambre: '#E07B39',        // CTA / Points — boutons principaux
  ambreDoux: '#F4A261',    // Accent chaud — highlights, tags

  // Neutres
  creme: '#F8F4ED',        // Background principal
  sable: '#C8B89A',        // Neutres — bordures, séparateurs
  charbon: '#1A1A2E',      // Texte principal

  // Utilitaires
  blanc: '#FFFFFF',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof colors;
