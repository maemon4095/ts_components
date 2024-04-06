import { ListQueue } from "../collections/mod.ts";

export class SimpleLock {
    readonly #waitings = new ListQueue<{ resolve: (v: void) => void; reject: (e: unknown) => void; }>();
    #locked = false;

    async acquire() {
        if (this.#locked) {
            await new Promise((resolve, reject) => {
                this.#waitings.enqueue({ resolve, reject });
            });
        } else {
            this.#locked = true;
        }
    }
    release() {
        if (!this.#locked) {
            return;
        }

        if (this.#waitings.isEmpty) {
            this.#locked = false;
        } else {
            const { resolve } = this.#waitings.dequeue()!;
            resolve();
        }
    }
}
