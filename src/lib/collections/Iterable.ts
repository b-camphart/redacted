export interface Iterable<T> {
    [Symbol.iterator](): Iterator<T>

    every(predicate: (item: T) => Boolean): Boolean
    some(predicate: (item: T) => Boolean): Boolean
}



export abstract class DefaultIterable<T> implements Iterable<T> {
    abstract [Symbol.iterator](): Iterator<T>;

    every(predicate: (item: T) => Boolean): Boolean {
        for (const item of this) {
            if (! predicate(item)) return false;
        }
        return true;
    }

    some(predicate: (item: T) => Boolean): Boolean {
        for (const item of this) {
            if (predicate(item)) return true;
        }
        return false;
    }

}