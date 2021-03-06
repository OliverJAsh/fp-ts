import { HKT, HKTS, HKT2, HKT2S } from './HKT'
import { StaticFunctor } from './Functor'
import { StaticPointed } from './Pointed'
import { StaticApplicative } from './Applicative'
import { StaticSemigroup } from './Semigroup'
import { FantasyApply } from './Apply'
import { StaticFoldable, FantasyFoldable } from './Foldable'
import { StaticSetoid } from './Setoid'
import { StaticTraversable, FantasyTraversable } from './Traversable'
import { StaticAlt, FantasyAlt } from './Alt'
import { constFalse, constTrue, Predicate } from './function'
import { Option, some, none } from './Option'
import { Either, left, right } from './Either'
import * as nea from './NonEmptyArray'

declare module './HKT' {
  interface HKT<A> {
    Validation: Validation<any, A>
  }
  interface HKT2<A, B> {
    Validation: Validation<A, B>
  }
}

export const URI = 'Validation'

export type URI = typeof URI

export type Validation<L, A> = Failure<L, A> | Success<L, A>

export class Failure<L, A> implements
  FantasyApply<URI, A>,
  FantasyFoldable<A>,
  FantasyTraversable<URI, A>,
  FantasyAlt<URI, A> {

  static of = of
  readonly _tag: 'Failure'
  readonly _L: L
  readonly _A: A
  readonly _URI: URI
  constructor(public readonly semigroup: StaticSemigroup<L>, public readonly value: L) {}
  map<B>(f: (a: A) => B): Validation<L, B> {
    return this as any
  }
  of<L2, B>(b: B): Validation<L2, B> {
    return of<L2, B>(b)
  }
  ap<B>(fab: Validation<L, (a: A) => B>): Validation<L, B> {
    if (isFailure(fab)) {
      return failure<L, B>(this.semigroup, this.semigroup.concat(fab.value, this.value))
    }
    return this as any
  }
  bimap<L2, B>(semigroup: StaticSemigroup<L2>, f: (l: L) => L2, g: (a: A) => B): Validation<L2, B> {
    return failure<L2, B>(semigroup, f(this.value))
  }
  alt(fy: Validation<L, A>): Validation<L, A> {
    return fy
  }
  reduce<B>(f: (b: B, a: A) => B, b: B): B {
    return b
  }
  traverse<F extends HKT2S>(applicative: StaticApplicative<F>): <L2, B>(f: (a: A) => HKT2<L2, B>[F]) => HKT2<L2, Validation<L, B>>[F]
  traverse<F extends HKTS>(applicative: StaticApplicative<F>): <B>(f: (a: A) => HKT<B>[F]) => HKT<Validation<L, B>>[F]
  traverse<F extends HKTS>(applicative: StaticApplicative<F>): <B>(f: (a: A) => HKT<B>[F]) => HKT<Validation<L, B>>[F] {
    return <B>(f: (a: A) => HKT<B>[F]) => applicative.of(this as any)
  }
  fold<B>(failure: (l: L) => B, success: (a: A) => B): B {
    return failure(this.value)
  }
  equals(setoid: StaticSetoid<A>, fy: Validation<L, A>): boolean {
    return fy.fold(constTrue, constFalse)
  }
  concat(fy: Validation<L, A>): Validation<L, A> {
    return fy.fold(
      l => failure<L, A>(this.semigroup, this.semigroup.concat(l, this.value)),
      () => this
    )
  }
  mapFailure<L2>(semigroup: StaticSemigroup<L2>, f: (l: L) => L2): Validation<L2, A> {
    return failure<L2, A>(semigroup, f(this.value))
  }
  swap(semigroup: StaticSemigroup<A>): Validation<A, L> {
    return success<A, L>(this.value)
  }
  toOption(): Option<A> {
    return none
  }
  toEither(): Either<L, A> {
    return left<L, A>(this.value)
  }
  /** Lift the Invalid value into a NonEmptyArray */
  toEitherNea(): Option<Validation<nea.NonEmptyArray<L>, A>> {
    return some(failure<nea.NonEmptyArray<L>, A>(nea, nea.of(this.value)))
  }
  inspect() {
    return this.toString()
  }
  toString() {
    return `Failure(${JSON.stringify(this.value)})`
  }
}

export class Success<L, A> implements
  FantasyApply<URI, A>,
  FantasyFoldable<A>,
  FantasyTraversable<URI, A>,
  FantasyAlt<URI, A> {

  static of = of
  readonly _tag: 'Success'
  readonly _L: L
  readonly _A: A
  readonly _URI: URI
  constructor(public readonly value: A) {}
  map<B>(f: (a: A) => B): Validation<L, B> {
    return new Success<L, B>(f(this.value))
  }
  of<L2, B>(b: B): Validation<L2, B> {
    return of<L2, B>(b)
  }
  ap<B>(fab: Validation<L, (a: A) => B>): Validation<L, B> {
    if (isSuccess(fab)) {
      return this.map(fab.value)
    }
    return fab as any
  }
  bimap<L2, B>(semigroup: StaticSemigroup<L2>, f: (l: L) => L2, g: (a: A) => B): Validation<L2, B> {
    return new Success<L2, B>(g(this.value))
  }
  alt(fy: Validation<L, A>): Validation<L, A> {
    return this
  }
  reduce<B>(f: (b: B, a: A) => B, b: B): B {
    return f(b, this.value)
  }
  traverse<F extends HKT2S>(applicative: StaticApplicative<F>): <L2, B>(f: (a: A) => HKT2<L2, B>[F]) => HKT2<L2, Validation<L, B>>[F]
  traverse<F extends HKTS>(applicative: StaticApplicative<F>): <B>(f: (a: A) => HKT<B>[F]) => HKT<Validation<L, B>>[F]
  traverse<F extends HKTS>(applicative: StaticApplicative<F>): <B>(f: (a: A) => HKT<B>[F]) => HKT<Validation<L, B>>[F] {
    return <B>(f: (a: A) => HKT<B>[F]) => applicative.map((b: B) => of<L, B>(b), f(this.value))
  }
  fold<B>(failure: (l: L) => B, success: (a: A) => B): B {
    return success(this.value)
  }
  equals(setoid: StaticSetoid<A>, fy: Validation<L, A>): boolean {
    return fy.fold(constFalse, y => setoid.equals(this.value, y))
  }
  concat(fy: Validation<L, A>): Validation<L, A> {
    return this
  }
  mapFailure<L2>(semigroup: StaticSemigroup<L2>, f: (l: L) => L2): Validation<L2, A> {
    return this as any
  }
  swap(semigroup: StaticSemigroup<A>): Validation<A, L> {
    return failure<A, L>(semigroup, this.value)
  }
  toOption(): Option<A> {
    return some(this.value)
  }
  toEither(): Either<L, A> {
    return right<L, A>(this.value)
  }
  /** Lift the Invalid value into a NonEmptyArray */
  toEitherNea(): Option<Validation<nea.NonEmptyArray<L>, A>> {
    return none
  }
  inspect() {
    return this.toString()
  }
  toString() {
    return `Success(${JSON.stringify(this.value)})`
  }
}

export function equals<L, A>(setoid: StaticSetoid<A>, fx: Validation<L, A>, fy: Validation<L, A>): boolean {
  return fx.equals(setoid, fy)
}

export function fold<L, A, B>(failure: (l: L) => B, success: (a: A) => B, fa: Validation<L, A>): B {
  return fa.fold(failure, success)
}

export function map<L, A, B>(f: (a: A) => B, fa: Validation<L, A>): Validation<L, B> {
  return fa.map(f)
}

export function of<L, A>(a: A): Success<L, A> {
  return new Success<L, A>(a)
}

export function getApplicativeS<L>(semigroup: StaticSemigroup<L>): StaticApplicative<URI> {
  function ap<A, B>(fab: Validation<L, (a: A) => B>, fa: Validation<L, A>): Validation<L, B> {
    return fa.ap(fab as Validation<L, (a: A) => B>)
  }

  return { URI, map, of, ap }
}

export function bimap<L, L2, A, B>(semigroup: StaticSemigroup<L2>, f: (l: L) => L2, g: (a: A) => B, fa: Validation<L, A>): Validation<L2, B> {
  return fa.bimap(semigroup, f, g)
}

export function alt<L, A>(fx: Validation<L, A>, fy: Validation<L, A>): Validation<L, A> {
  return fx.alt(fy as Validation<L, A>)
}

export function reduce<L, A, B>(f: (b: B, a: A) => B, b: B, fa: Validation<L, A>): B {
  return fa.reduce(f, b)
}

export function traverse<F extends HKT2S>(applicative: StaticApplicative<F>): <L2, L, A, B>(f: (a: A) => HKT2<L2, B>[F], ta: Validation<L, A>) => HKT2<L2, Validation<L, B>>[F]
export function traverse<F extends HKTS>(applicative: StaticApplicative<F>): <L, A, B>(f: (a: A) => HKT<B>[F], ta: Validation<L, A>) => HKT<Validation<L, B>>[F]
export function traverse<F extends HKTS>(applicative: StaticApplicative<F>): <L, A, B>(f: (a: A) => HKT<B>[F], ta: Validation<L, A>) => HKT<Validation<L, B>>[F] {
  return <L, A, B>(f: (a: A) => HKT<B>[F], ta: Validation<L, A>) => ta.traverse<F>(applicative)<B>(f)
}

export function isFailure<L, A>(fa: Validation<L, A>): fa is Failure<L, A> {
  return fa instanceof Failure
}

export function isSuccess<L, A>(fa: Validation<L, A>): fa is Success<L, A> {
  return fa instanceof Success
}

export function failure<L, A>(semigroup: StaticSemigroup<L>, l: L): Failure<L, A> {
  return new Failure<L, A>(semigroup, l)
}

export function success<L, A>(a: A): Success<L, A> {
  return new Success<L, A>(a)
}

export function fromPredicate<L, A>(semigroup: StaticSemigroup<L>, predicate: Predicate<A>, l: (a: A) => L): (a: A) => Validation<L, A> {
  return a => predicate(a) ? success<L, A>(a) : failure<L, A>(semigroup, l(a))
}

export function concat<L, A>(fx: Validation<L, A>, fy: Validation<L, A>): Validation<L, A> {
  return fx.concat(fy)
}

export function mapFailure<L, L2, A>(semigroup: StaticSemigroup<L2>, f: (l: L) => L2, fa: Validation<L, A>): Validation<L2, A> {
  return fa.mapFailure(semigroup, f)
}

export function swap<L, A>(semigroup: StaticSemigroup<A>, fa: Validation<L, A>): Validation<A, L> {
  return fa.swap(semigroup)
}

export function toOption<L, A>(fa: Validation<L, A>): Option<A> {
  return fa.toOption()
}

export function toEither<L, A>(fa: Validation<L, A>): Either<L, A> {
  return fa.toEither()
}

export function toEitherNea<L, A>(fa: Validation<L, A>): Option<Validation<nea.NonEmptyArray<L>, A>> {
  return fa.toEitherNea()
}

// tslint:disable-next-line no-unused-expression
;(
  { map, of, reduce, traverse, alt } as (
    StaticFunctor<URI> &
    StaticPointed<URI> &
    StaticFoldable<URI> &
    StaticTraversable<URI> &
    StaticAlt<URI>
  )
)
