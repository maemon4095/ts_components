import { ListQueue } from "../collections/mod.ts";
import { Sender, Receiver } from "./channel.ts";
import { ChannelClosedError } from "./error.ts";

export function unbounded<T>(): [Sender<T>, Receiver<T>] {
    const items = new ListQueue<T>();
    const waitings = new ListQueue<{ resolve: (value: T) => void; reject: () => void; }>();
    let closed = false;

    // deno-lint-ignore require-await
    async function send(value: T) {
        if (closed) {
            throw ChannelClosedError.sending();
        }

        if (waitings.isEmpty) {
            items.enqueue(value);
        } else {
            const { resolve } = waitings.dequeue()!;
            resolve(value);
        }
    }

    async function receive() {
        if (closed) {
            if (items.isEmpty) throw ChannelClosedError.receiving();
            return items.dequeue()!;
        }

        if (!items.isEmpty) {
            return items.dequeue()!;
        } else {
            return await new Promise<T>((resolve, reject) => {
                waitings.enqueue({
                    resolve, reject: () => {
                        reject(ChannelClosedError.receiving());
                    }
                });
            });
        }
    }

    function close() {
        if (closed) {
            return;
        }
        closed = true;
        while (true) {
            const callback = waitings.dequeue();
            if (callback === null) {
                break;
            }
            callback.reject();
        }
    }

    const sender: Sender<T> = {
        send,
        close
    };
    const receiver: Receiver<T> = {
        receive,
        close
    };

    return [sender, receiver];
}