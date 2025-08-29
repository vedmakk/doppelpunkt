/**
 * Safe localStorage wrapper that never throws exceptions.
 * Provides consistent error handling for storage quota issues and restricted environments.
 */
export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* no-op */
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      /* no-op */
    }
  },
}
