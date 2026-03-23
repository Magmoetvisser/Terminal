export const colors = {
  // Backgrounds (3 levels)
  bg: '#0a0a0a',
  surface: '#111',
  elevated: '#1a1a1a',

  // Borders (2 levels)
  border: '#1a1a1a',
  borderStrong: '#2a2a2a',

  // Text (4 levels)
  text: '#e0e0e0',
  textSecondary: '#aaa',
  textMuted: '#666',
  textDim: '#444',

  // Accent (default, user can override via accentColor)
  accent: '#4ade80',

  // Semantic colors
  blue: '#60a5fa',
  yellow: '#facc15',
  red: '#f87171',
  purple: '#c084fc',
  teal: '#2dd4bf',
  gray: '#6b7280',

  // Status colors
  status: {
    working: '#4ade80',
    thinking: '#facc15',
    waiting: '#60a5fa',
    idle: '#6b7280',
    done: '#6b7280',
    error: '#f87171',
    help: '#c084fc',
  } as Record<string, string>,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const radius = {
  xs: 4,    // badges, tags
  sm: 8,    // small buttons, chips
  md: 12,   // cards, inputs, list items
  lg: 20,   // modals, sheets
};

export const fontSize = {
  title: 24,    // page titles
  header: 17,   // section headers
  body: 15,     // buttons, menu items
  standard: 14, // list items, labels
  caption: 12,  // metadata, timestamps
  micro: 11,    // badges, tags
};

export const font = {
  mono: 'monospace',
};

export function getStatusColor(status: string): string {
  const s = (status || 'idle').toLowerCase();
  return colors.status[s] || colors.gray;
}
