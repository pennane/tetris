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
  view: R.view(lens),
  set: R.set(lens),
  over: R.over(lens)
})

export const prop =
  <S>() =>
  <K extends keyof S>(key: K) =>
    accessor(R.lensProp<S, K>(key))

export const compose = <S, A, B>(
  outer: Accessor<S, A>,
  inner: Accessor<A, B>
) => accessor(R.compose(outer.lens, inner.lens))
