export class ArrayQueue<T> {
    #buffer: T[];
    #head: number;
    #count: number;

    constructor(initialCapacity?: number) {
        this.#buffer = new Array(initialCapacity);
        this.#count = 0;
        this.#head = 0;
    }

    get count(): number {
        return this.#count;
    }

    get capacity(): number {
        return this.#buffer.length;
    }

    get isEmpty(): boolean {
        return this.#count === 0;
    }

    #resize() {
        const newbuffer = new Array(Math.max(this.capacity * 2, 16));
        const count = this.#count;
        let idx = 0;
        while (!this.isEmpty) {
            const item = this.dequeue();
            newbuffer[idx] = item;
            idx += 1;
        }
        this.#head = 0;
        this.#count = count;
        this.#buffer = newbuffer;
    }

    enqueue(item: T): void {
        if (this.#count == this.capacity) {
            this.#resize();
        }
        this.#buffer[(this.#head + this.#count) % this.capacity] = item;
        this.#count += 1;
    }

    dequeue(): T | undefined {
        if (this.#count === 0) {
            return undefined;
        }
        const head = this.#buffer[this.#head];
        this.#head = (this.#head + 1) % this.capacity;
        this.#count -= 1;
        return head;
    }
}