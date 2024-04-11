import { ArrayQueue } from "../collections/mod.ts";
import { Result } from "../monadic/mod.ts";
import { Sender, Receiver, TryReceiveError, TrySendError } from "./channel.ts";
import { ChannelClosedError } from "./error.ts";
import { fireAndForget } from "./util.ts";

export function bounded<T>(capacity: number): [Sender<T>, Receiver<T>] {
    const items = new ArrayQueue<T>(capacity);
    const waitingSenders = new ArrayQueue<{ resolve: () => void; reject: () => void; }>();
    const waitingReceivers = new ArrayQueue<{ resolve: (value: T) => void; reject: () => void; }>();
    let closed = false;

    function trySend(value: T): Result<void, TrySendError> {
        if (closed) {
            return { isOk: false, err: "closed" };
        }

        if (waitingReceivers.isEmpty) {
            if (items.count === items.capacity) {
                return { isOk: false, err: "full" };
            }
            items.enqueue(value);
        } else {
            const { resolve } = waitingReceivers.dequeue()!;
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

        if (!waitingSenders.isEmpty) {
            const sender = waitingSenders.dequeue()!;
            fireAndForget(() => sender.resolve());
        }

        return { isOk: true, value };
    }

    async function send(value: T) {
        if (closed) {
            throw ChannelClosedError.sending();
        }

        if (waitingReceivers.isEmpty) {
            if (items.count === items.capacity) {
                await new Promise<void>((resolve, reject) => {
                    waitingSenders.enqueue({
                        resolve, reject: () => reject(ChannelClosedError.sending())
                    });
                });
                return send(value);
            }
            items.enqueue(value);
        } else {
            const { resolve } = waitingReceivers.dequeue()!;
            fireAndForget(() => resolve(value));
        }
    }

    async function receive() {
        if (closed) {
            if (items.isEmpty) throw ChannelClosedError.receiving();
            return items.dequeue()!;
        }

        if (!items.isEmpty) {
            const item = items.dequeue()!;
            if (!waitingSenders.isEmpty) {
                const { resolve } = waitingSenders.dequeue()!;
                fireAndForget(() => resolve());
            }
            return item;
        } else {
            return await new Promise<T>((resolve, reject) => {
                waitingReceivers.enqueue({
                    resolve, reject: () => reject(ChannelClosedError.receiving())
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
            const receiver = waitingReceivers.dequeue();
            if (receiver === undefined) {
                break;
            }
            receiver.reject();
        }
        while (true) {
            const sender = waitingSenders.dequeue();
            if (sender === undefined) {
                break;
            }
            sender.reject();
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