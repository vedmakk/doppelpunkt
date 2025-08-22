export const parseHotKeys = (keys: string): string[] =>
  keys.toLowerCase().split('+')
