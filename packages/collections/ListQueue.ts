export class ListQueue<T> {
    #pair: null | { head: Node<T>, tail: Node<T>; };
    constructor() {
        this.#pair = null;
    }

    get isEmpty(): boolean {
        return this.#pair === null;
    }

    enqueue(value: T): void {
        const node: Node<T> = {
            value: value,
            next: null
        };
        if (this.#pair === null) {
            this.#pair = { head: node, tail: node };
        } else {
            this.#pair.tail.next = node;
            this.#pair.tail = node;
        }
    }

    dequeue(): T | null {
        const pair = this.#pair;
        if (pair === null) {
            return null;
        }
        const head = pair.head;
        const next = head.next;
        if (next === null) {
            this.#pair = null;
        } else {
            pair.head = next;
        }
        return head.value;
    }
}

type Node<T> = { value: T; next: null | Node<T>; };