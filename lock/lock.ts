import { ListQueue } from "../collections/mod.ts";

export class SimpleLock {
    readonly #waitings = new ListQueue<(v: void) => void>();
    #locked = false;

    async acquire() {
        if (this.#locked) {
            await new Promise((resolve) => {
                this.#waitings.enqueue(resolve);
            });
        } else {
            this.#locked = true;
        }

        let released = false;
        const release = () => {
            if (released) return;
            released = true;
            if (!this.#locked) {
                return;
            }

            if (this.#waitings.isEmpty) {
                this.#locked = false;
            } else {
                const resolve = this.#waitings.dequeue()!;
                resolve();
            }
        };

        return {
            release
        };
    }
}
