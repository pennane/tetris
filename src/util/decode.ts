import * as R from 'ramda'

export type Decoder<T> = (v: unknown) => T | null

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

export const map =
  <A, B>(f: (a: A) => B) =>
  (decoder: Decoder<A>): Decoder<B> =>
  (v) => {
    const a = decoder(v)
    return a === null ? null : f(a)
  }

export function refine<T, U extends T>(
  decoder: Decoder<T>,
  guard: (t: T) => t is U
): Decoder<U>
export function refine<T>(decoder: Decoder<T>, ok: (t: T) => boolean): Decoder<T>
export function refine<T>(decoder: Decoder<T>, ok: (t: T) => boolean) {
  return (v: unknown) => {
    const t = decoder(v)
    return t !== null && ok(t) ? t : null
  }
}

export const oneOf =
  <const T extends readonly unknown[]>(values: T): Decoder<T[number]> =>
  (v) =>
    values.includes(v) ? (v as T[number]) : null

export const literal = <const T>(value: T) => oneOf([value])

export const boolean: Decoder<boolean> = (v) =>
  typeof v === 'boolean' ? v : null

export const number: Decoder<number> = (v) =>
  typeof v === 'number' ? v : null

export const int = refine(number, Number.isInteger)
export const count = refine(int, R.lte(0))

export const hasLength =
  (n: number) =>
  (xs: readonly unknown[]) =>
    xs.length === n

export const arrayOf =
  <T>(item: Decoder<T>): Decoder<readonly T[]> =>
  (v) => {
    if (!Array.isArray(v)) return null
    const out: T[] = []
    for (const x of v) {
      const decoded = item(x)
      if (decoded === null) return null
      out.push(decoded)
    }
    return out
  }

export const struct =
  <T extends object>(fields: { [K in keyof T]: Decoder<T[K]> }): Decoder<T> =>
  (v) => {
    if (!isRecord(v)) return null
    const out: Partial<T> = {}
    for (const key in fields) {
      const decoded = fields[key](v[key])
      if (decoded === null) return null
      out[key] = decoded
    }
    return out as T
  }
