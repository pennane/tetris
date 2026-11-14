export type Writer<S, W> = Readonly<{ state: S; events: readonly W[] }>
export type Step<S, W> = (state: S) => Writer<S, W>

const NO_EVENTS: readonly never[] = Object.freeze([])

const concat = <W>(a: readonly W[], b: readonly W[]): readonly W[] =>
  b.length === 0 ? a : a.length === 0 ? b : [...a, ...b]

export const pure = <S>(state: S): Writer<S, never> => ({
  state,
  events: NO_EVENTS
})

export const tell =
  <S, W>(...events: W[]): Step<S, W> =>
  (state) => ({ state, events })

export const lift =
  <S>(f: (state: S) => S): Step<S, never> =>
  (state) =>
    pure(f(state))

export const chain =
  <S, W>(step: Step<S, W>) =>
  (w: Writer<S, W>): Writer<S, W> => {
    const next = step(w.state)
    return { state: next.state, events: concat(w.events, next.events) }
  }

export const pipeK =
  <S, W>(...steps: readonly Step<S, W>[]): Step<S, W> =>
  (state) =>
    steps.reduce<Writer<S, W>>((w, step) => chain(step)(w), pure(state))

export const foldK =
  <S, W, M>(step: (state: S, msg: M) => Writer<S, W>) =>
  (state: S, msgs: readonly M[]): Writer<S, W> =>
    msgs.reduce<Writer<S, W>>(
      (w, msg) => chain<S, W>((s) => step(s, msg))(w),
      pure(state)
    )
