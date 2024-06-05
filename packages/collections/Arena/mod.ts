
const arenaBland: unique symbol = Symbol();

export type ArenaId = number & { [arenaBland]: typeof arenaBland; };

// deno-lint-ignore ban-types
export class Arena<T extends {} | null> {
    #slots: (T | Slot)[];
    #free: number;

    constructor(capacity?: number) {
        capacity ??= 0;
        const slots = new Array<Slot>(capacity);

        initSlots(slots, 0);

        this.#slots = slots;
        this.#free = capacity === 0 ? -1 : 0;
    }

    get(id: ArenaId): T | undefined {
        const slot = this.#slots[id];
        if (slot instanceof Slot) {
            return undefined;
        }
        return slot;
    }

    alloc(value: T): ArenaId {
        const slots = this.#slots;
        if (this.#free < 0) {
            const len = this.#slots.length;
            slots.length = Math.max(len * 2, 16);
            initSlots(slots, len);
            this.#free = len;
        }
        const id = this.#free;
        const slot = slots[id] as Slot;
        this.#free = slot.next;
        slots[id] = value;
        return id as ArenaId;
    }

    delete(id: ArenaId) {
        const slot = this.#slots[id];
        if (slot === undefined || slot instanceof Slot) {
            throw new Error("Arena.delete was called with already deleted id.");
        }
        this.#slots[id] = new Slot(this.#free);
        this.#free = id;
    }

    [Symbol.iterator](): Iterator<T> {
        let idx = 0;
        const slots = this.#slots;
        return {
            next(): IteratorResult<T> {
                while (true) {
                    if (idx >= slots.length) {
                        return { done: true, value: undefined };
                    }
                    const slot = slots[idx];
                    idx++;
                    if (!(slot instanceof Slot)) {
                        return { done: false, value: slot };
                    }
                }
            }
        };
    }
}

function initSlots<T>(slots: (T | Slot)[], offset: number) {
    if (slots.length <= offset) {
        return;
    }
    const last = slots.length - 1;
    for (let i = offset; i < last; ++i) {
        slots[i] = new Slot(i + 1);
    }
    slots[last] = Slot.SENTINEL;
}

class Slot {
    static readonly SENTINEL = new Slot(-1);

    readonly next: number;
    constructor(next: number) {
        this.next = next;
    }
}