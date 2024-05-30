import { ListQueue } from "@maemon4095/collections";
import { Result } from "@maemon4095/result";
import { Sender, Receiver, TryReceiveError, TrySendError } from "./channel.ts";
import { ChannelClosedError } from "./error.ts";
import { fireAndForget } from "./util.ts";

export function unbounded<T>(): [Sender<T>, Receiver<T>] {
    const items = new ListQueue<T>();
    const waitings = new ListQueue<{ resolve: (value: T) => void; reject: () => void; }>();
    let closed = false;

    function trySend(value: T): Result<void, TrySendError> {
        if (closed) {
            return { isOk: false, err: "closed" };
        }

        if (waitings.isEmpty) {
            items.enqueue(value);
        } else {
            const { resolve } = waitings.dequeue()!;
            fireAndForget(() => resolve(value));
        }
        return { isOk: true, value: undefined };
    }

    function tryReceive(): Result<T, TryReceiveError> {
        if (closed) {
            if (items.isEmpty) return { isOk: false, err: "closed" };
        }
        if (items.isEmpty) {
            return { isOk: false, err: "empty" };
        }
        const value = items.dequeue()!;
        return { isOk: true, value };
    }


    // deno-lint-ignore require-await
    async function send(value: T) {
        if (closed) {
            throw ChannelClosedError.sending();
        }

        if (waitings.isEmpty) {
            items.enqueue(value);
        } else {
            const { resolve } = waitings.dequeue()!;
            fireAndForget(() => resolve(value));
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
        trySend,
        send,
        close
    };
    const receiver: Receiver<T> = {
        tryReceive,
        receive,
        close
    };

    return [sender, receiver];
}