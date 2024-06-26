import { ArrayQueue } from "@maemon4095/collections";
import { Result } from "@maemon4095/result";
import { Sender, Receiver, TryReceiveError, TrySendError } from "./channel.ts";
import { ChannelClosedError } from "./error.ts";
import { fireAndForget } from "./util.ts";

export function bounded<T>(capacity: number): [Sender<T>, Receiver<T>] {
    if (capacity < 0) {
        throw new Error(`bounded channel capacity must be greater than or equal to 0.`);
    }
    if (capacity === 0) {
        return syncChannel();
    }

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

function syncChannel<T>(): [Sender<T>, Receiver<T>] {
    const waitingSenders = new ArrayQueue<{ resolve: () => T; reject: () => void; }>();
    const waitingReceivers = new ArrayQueue<{ resolve: (value: T) => void; reject: () => void; }>();
    let closed = false;


    function trySend(item: T): Result<void, TrySendError> {
        if (closed) return { isOk: false, err: "closed" };
        if (waitingReceivers.isEmpty) return { isOk: false, err: "full" };
        const receiver = waitingReceivers.dequeue()!;
        fireAndForget(() => receiver.resolve(item));
        return { isOk: true, value: undefined };
    }

    function tryReceive(): Result<T, TryReceiveError> {
        if (closed) return { isOk: false, err: "closed" };
        if (waitingSenders.isEmpty) return { isOk: false, err: "empty" };
        const sender = waitingSenders.dequeue()!;
        const value = sender.resolve();
        return { isOk: true, value };
    }

    async function send(item: T): Promise<void> {
        if (closed) throw ChannelClosedError.sending();
        if (waitingReceivers.isEmpty) {
            await new Promise<void>((resolve, reject) => {
                waitingSenders.enqueue({
                    resolve: () => {
                        fireAndForget(() => resolve());
                        return item;
                    },
                    reject: () => reject(ChannelClosedError.sending())
                });
            });
        } else {
            const receiver = waitingReceivers.dequeue()!;
            fireAndForget(() => receiver.resolve(item));
        }
    }

    async function receive(): Promise<T> {
        if (closed) throw ChannelClosedError.receiving();
        if (waitingSenders.isEmpty) {
            return await new Promise<T>((resolve, reject) => {
                waitingReceivers.enqueue({
                    resolve, reject: () => reject(ChannelClosedError.receiving())
                });
            });
        } else {
            const sender = waitingSenders.dequeue()!;
            return sender.resolve();
        }
    }

    function close() {
        closed = true;
        while (true) {
            const receiver = waitingReceivers.dequeue();
            if (receiver === undefined) break;
            receiver.reject();
        }

        while (true) {
            const sender = waitingSenders.dequeue();
            if (sender === undefined) break;
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