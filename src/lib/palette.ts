/** Bold pastel player colours. `deep` is the darker shade used for 3D edges and text. */
export const PLAYER_COLORS = [
  { id: 'coral', base: '#FF8A7A', deep: '#D9584A' },
  { id: 'teal', base: '#4FD1C5', deep: '#239C90' },
  { id: 'lilac', base: '#B69CFF', deep: '#7D5FE0' },
  { id: 'butter', base: '#FFD45C', deep: '#D19F1C' },
  { id: 'sky', base: '#6EC6FF', deep: '#2F8FD1' },
  { id: 'mint', base: '#7EE0A1', deep: '#3DAA66' },
  { id: 'pink', base: '#FF8FC7', deep: '#D9589A' },
  { id: 'orange', base: '#FFAA5C', deep: '#D97A22' },
  { id: 'periwinkle', base: '#8FA3FF', deep: '#5468D9' },
  { id: 'lime', base: '#C5E86C', deep: '#8DB52E' },
] as const;

export type PlayerColorId = (typeof PLAYER_COLORS)[number]['id'];

export function colorOf(id: string | undefined) {
  return PLAYER_COLORS.find((c) => c.id === id) ?? PLAYER_COLORS[0];
}

export const PLAYER_EMOJIS = [
  '😎', '🤠', '🦁', '🐻', '🦊', '🐸', '🐙', '🦄', '🐯', '🐼',
  '🦖', '🐧', '🦉', '🐺', '🦈', '🐝', '🍕', '🌮', '🍺', '☕',
  '🔥', '⚡', '🌈', '🚀', '👑', '💪', '🎩', '🧢', '🥸', '🤖',
];
