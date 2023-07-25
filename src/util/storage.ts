export const STORAGE_BASE_KEY = 'pennanen-dev-tetris-' as const

export const store = (value: string, key: string) => {
  localStorage.setItem(STORAGE_BASE_KEY.concat(key), value)
}

export const load = <T>(key: string, parser: (v: unknown) => T): T => {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(STORAGE_BASE_KEY.concat(key)) || ''
    )
    return parser(value)
  } catch {
    return parser(null)
  }
}
