import { type Iterable, DefaultIterable } from "$lib/collections/Iterable";

export class IntProgression extends DefaultIterable<number> implements Iterable<number> {

    constructor(
        public first: number,
        public last: number,
        public step: number = 1,
    ) {
        super();
    }

    [Symbol.iterator](): Iterator<number> {
        let current = this.first;
        return {
            next: () => {
                const value = current;
                current += this.step;
                if (value > this.last) {
                    return { value: undefined, done: true }
                } else {
                    return { value, done: false }
                };
            }
        }
    }

    toString(): string {
        return `(${this.first} rangeTo ${this.last} step ${this.step})` 
    }

}

export function range(first: number, last: number, step: number = 1): IntProgression {
    return new IntProgression(first, last, step);
}
