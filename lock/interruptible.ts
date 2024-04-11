import { ListQueue } from "../collections/mod.ts";

export class InterruptibleLock {
    readonly #waitings = new ListQueue<{ resolve: (v: void) => void; reject: (e: unknown) => void; }>();
    #locked = false;
    #interruptionResolve?: (v: void) => void;

    async acquire() {
        if (this.#locked) {
            await new Promise((resolve, reject) => {
                this.#waitings.enqueue({ resolve, reject });
            });
        } else {
            this.#locked = true;
        }

        let released = false;
        const release = () => {
            if (released) return;
            released = true;
            if (!this.#locked) return;
            if (this.#waitings.isEmpty) {
                this.#locked = false;
            } else if (this.#interruptionResolve) {
                const resolve = this.#interruptionResolve;
                this.#interruptionResolve = undefined;
                while (true) {
                    const pair = this.#waitings.dequeue();
                    if (pair === null) break;
                    pair.reject(new LockInterruptedError());
                }
                resolve();
            } else {
                const { resolve } = this.#waitings.dequeue()!;
                resolve();
            }
        };
        return {
            release
        };
    }
    async interrupt() {
        if (this.#locked) {
            await new Promise(resolve => {
                this.#interruptionResolve = resolve;
            });
        } else {
            this.#locked = true;
        }
    }
}
export class LockInterruptedError extends Error {
    message = "Failed to acquire lock due to interrupt.";
}
