export const STORAGE_BASE_KEY = 'pennanen-dev-tetris-'

export const store = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(STORAGE_BASE_KEY + key, JSON.stringify(value))
  } catch {}
}

export const load = <T>(key: string, decode: (v: unknown) => T): T => {
  try {
    const raw = localStorage.getItem(STORAGE_BASE_KEY + key)
    return decode(raw === null ? null : JSON.parse(raw))
  } catch {
    return decode(null)
  }
}
