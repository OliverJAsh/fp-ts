import { StaticMonad } from './Monad'
import { Lazy } from './function'

declare module './HKT' {
  interface HKT<A> {
    Eff: Eff<any, A>
  }
}

export const URI = 'Eff'

export type URI = typeof URI

export type Pure<A> = Eff<never, A>

export class Eff<E, A> implements Eff<E, A> {
  static of = of
  constructor(private value: Lazy<A>) {}
  run(): A {
    return this.value()
  }
  map<B>(f: (a: A) => B): Eff<E, B> {
    return new Eff<E, B>(() => f(this.run()))
  }
  ap<E2, B>(fab: Eff<E2, (a: A) => B>): Eff<E | E2, B> {
    return new Eff<E | E2, B>(() => fab.run()(this.run()))
  }
  chain<E2, B>(f: (a: A) => Eff<E2, B>): Eff<E | E2, B> {
    return new Eff<E | E2, B>(() => f(this.run()).run())
  }
}

export function map<E, A, B>(f: (a: A) => B, fa: Eff<E, A>): Eff<E, B> {
  return fa.map(f)
}

export function of<E, A>(a: A): Eff<E, A> {
  return new Eff<E, A>(() => a)
}

export function ap<E, A, B, E2>(fab: Eff<E2, (a: A) => B>, fa: Eff<E, A>): Eff<E, B> {
  return fa.ap(fab)
}

export function chain<E, A, B, E2>(f: (a: A) => Eff<E2, B>, fa: Eff<E, A>): Eff<E, B> {
  return fa.chain(f)
}

// tslint:disable-next-line no-unused-expression
;(
  { map, of, ap, chain } as (
    StaticMonad<URI>
  )
)
