export type Writer<S, W> = Readonly<{ state: S; events: readonly W[] }>

const NO_EVENTS: readonly never[] = Object.freeze([])

const concat = <W>(a: readonly W[], b: readonly W[]): readonly W[] =>
  b.length === 0 ? a : a.length === 0 ? b : [...a, ...b]

export const of = <S, W = never>(state: S): Writer<S, W> => ({
  state,
  events: NO_EVENTS
})

export const map =
  <A, B>(f: (a: A) => B) =>
  <W>(w: Writer<A, W>): Writer<B, W> => ({ state: f(w.state), events: w.events })

export const chain =
  <A, B, W>(f: (a: A) => Writer<B, W>) =>
  (w: Writer<A, W>): Writer<B, W> => {
    const next = f(w.state)
    return { state: next.state, events: concat(w.events, next.events) }
  }

export const emit =
  <W>(...events: W[]) =>
  <S>(w: Writer<S, W>): Writer<S, W> => ({
    state: w.state,
    events: concat(w.events, events)
  })
