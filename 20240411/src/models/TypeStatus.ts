export const TypeStatus = {
  RANDOM: 'random',
  TO_FIX: 'toFix',
} as const;

export type TypeStatus = (typeof TypeStatus)[keyof typeof TypeStatus];
