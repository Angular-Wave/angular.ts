export type Mapper<X, T> = (x: X, key?: string | number) => T;
export interface TypedMap<T> {
  [key: string]: T;
}
export type Predicate<X> = (x?: X) => boolean;
export type PredicateBinary<X, Y> = (x?: X, y?: Y) => boolean;
