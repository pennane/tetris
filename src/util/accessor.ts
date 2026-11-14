import type { Lens } from 'ramda'
import * as R from 'ramda'

export type Accessor<S, A> = Readonly<{
  lens: Lens<S, A>
  view: (s: S) => A
  set: (a: A) => (s: S) => S
  over: (f: (a: A) => A) => (s: S) => S
}>

export const accessor = <S, A>(lens: Lens<S, A>): Accessor<S, A> => ({
  lens,
  view: (s) => R.view(lens, s),
  set: (a) => (s) => R.set(lens, a, s),
  over: (f) => (s) => R.over(lens, f, s)
})

export const prop =
  <S>() =>
  <K extends keyof S>(key: K): Accessor<S, S[K]> =>
    accessor(R.lensProp<S, K>(key))

export const compose = <S, A, B>(
  outer: Accessor<S, A>,
  inner: Accessor<A, B>
): Accessor<S, B> =>
  accessor(
    R.lens<S, B>(
      (s) => inner.view(outer.view(s)),
      (b, s) => outer.over(inner.set(b))(s)
    )
  )
