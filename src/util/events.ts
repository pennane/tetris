export type WithEvents<T, E> = Readonly<{ value: T; events: readonly E[] }>

const NO_EVENTS: readonly never[] = Object.freeze([])

const concat = <E>(a: readonly E[], b: readonly E[]): readonly E[] =>
  b.length === 0 ? a : a.length === 0 ? b : [...a, ...b]

export const of = <T, E = never>(value: T): WithEvents<T, E> => ({
  value,
  events: NO_EVENTS
})

export const map =
  <A, B>(f: (a: A) => B) =>
  <E>(w: WithEvents<A, E>): WithEvents<B, E> => ({
    value: f(w.value),
    events: w.events
  })

export const chain =
  <A, B, E>(f: (a: A) => WithEvents<B, E>) =>
  (w: WithEvents<A, E>): WithEvents<B, E> => {
    const next = f(w.value)
    return { value: next.value, events: concat(w.events, next.events) }
  }

export const emit =
  <E>(...events: E[]) =>
  <T>(w: WithEvents<T, E>): WithEvents<T, E> => ({
    value: w.value,
    events: concat(w.events, events)
  })
