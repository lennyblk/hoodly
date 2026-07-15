
export interface EventVisualSource {
  id: string;
  type?: string;
  emoji?: string;
}

export const EVENT_EMOJI_CHOICES = ['🎉', '🎨', '🛠️', '🏃', '🛍️', '🤝', '❤️', '🌿', '🍳', '🎵', '📚', '📅'];


const CATEGORY_VISUALS: Record<string, { bg: string; emoji: string }> = {
  social: { bg: '#E8F4ED', emoji: '🎉' },
  culture: { bg: '#F3E5F5', emoji: '🎨' },
  atelier: { bg: '#FFF3E0', emoji: '🛠️' },
  sport: { bg: '#E3F2FD', emoji: '🏃' },
  commerce: { bg: '#FFF8E1', emoji: '🛍️' },
  reunion: { bg: '#E8EAF6', emoji: '🗣️' },
  solidarite: { bg: '#FCE4EC', emoji: '❤️' },
  contract: { bg: '#E8EAF6', emoji: '📝' },
};

const FALLBACK_THUMBNAILS = [
  { bg: '#E8F4ED', emoji: '🎉' },
  { bg: '#FFF3E0', emoji: '🌿' },
  { bg: '#E3F2FD', emoji: '🏃' },
  { bg: '#FCE4EC', emoji: '🍳' },
  { bg: '#F3E5F5', emoji: '🎨' },
  { bg: '#E8EAF6', emoji: '🤝' },
  { bg: '#FFF8E1', emoji: '🎵' },
];

export function getEventVisual(event: EventVisualSource): { bg: string; emoji: string } {
  const category = event.type ? CATEGORY_VISUALS[event.type] : undefined;
  const fallback = FALLBACK_THUMBNAILS[event.id.charCodeAt(event.id.length - 1) % FALLBACK_THUMBNAILS.length];
  return {
    emoji: event.emoji || category?.emoji || fallback.emoji,
    bg: category?.bg ?? fallback.bg,
  };
}
