export type WithEvents<S, E> = Readonly<{ state: S; events: readonly E[] }>

const NO_EVENTS: readonly never[] = Object.freeze([])

const concat = <E>(a: readonly E[], b: readonly E[]): readonly E[] =>
  b.length === 0 ? a : a.length === 0 ? b : [...a, ...b]

export const of = <S, E = never>(state: S): WithEvents<S, E> => ({
  state,
  events: NO_EVENTS
})

export const map =
  <A, B>(f: (a: A) => B) =>
  <E>(w: WithEvents<A, E>): WithEvents<B, E> => ({
    state: f(w.state),
    events: w.events
  })

export const chain =
  <A, B, E>(f: (a: A) => WithEvents<B, E>) =>
  (w: WithEvents<A, E>): WithEvents<B, E> => {
    const next = f(w.state)
    return { state: next.state, events: concat(w.events, next.events) }
  }

export const emit =
  <E>(...events: E[]) =>
  <S>(w: WithEvents<S, E>): WithEvents<S, E> => ({
    state: w.state,
    events: concat(w.events, events)
  })
