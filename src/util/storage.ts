export const STORAGE_BASE_KEY = 'pennanen-dev-tetris-' as const

export const store = (value: unknown, key: string) => {
  localStorage.setItem(STORAGE_BASE_KEY.concat(key), JSON.stringify(value))
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
