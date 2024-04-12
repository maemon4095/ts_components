import { bounded } from "../channel/mod.ts";

export function iterableStream<T>(iterable: AsyncIterable<T>): ReadableStream<T> {
    let iter: AsyncIterator<T> | undefined;
    return new ReadableStream({
        start() {
            iter = iterable[Symbol.asyncIterator]();
        },
        async pull(controller) {
            if (iter === undefined) {
                controller.close();
                return;
            }
            const { done, value } = await iter.next();
            if (done) {
                iter = undefined;
                controller.close();
            } else {
                controller.enqueue(value);
            }
        },
    });
}

export function transform<T, U>(f: (item: T) => U): TransformStream<T, U> {
    return new TransformStream<T, U>({
        start() { },
        transform(chunk, controller) {
            controller.enqueue(f(chunk));
        }
    });
}

export function asyncIterable<T>(iterable: Iterable<Promise<T>>): AsyncIterable<T> {
    return {
        [Symbol.asyncIterator]() {
            const iter = iterable[Symbol.iterator]();
            return {
                async next(...args: [] | [undefined]): Promise<IteratorResult<T>> {
                    const { done, value } = iter.next(...args);
                    if (done) return { done, value: undefined };
                    return { done, value: await value };
                }
            } satisfies AsyncIterator<T>;
        }
    };
}

export function debounce<T>(ms: number, iterable: AsyncIterable<T>): AsyncIterable<T> {
    return {
        [Symbol.asyncIterator](): AsyncIterator<T> {
            const [sender, receiver] = bounded<IteratorResult<T>>(0);
            const iter = iterable[Symbol.asyncIterator]();

            let timeout: undefined | number = undefined;
            new Promise<void>(resolve => {
                (async () => {
                    while (true) {
                        const result = await iter.next();
                        clearTimeout(timeout);
                        timeout = setTimeout(() => {
                            sender.send(result);
                        }, ms);
                        if (result.done) break;
                    }

                    resolve();
                })();
            });

            let done = false;
            return {
                async next() {
                    if (done) return { done, value: undefined };
                    const result = await receiver.receive();
                    if (result.done) {
                        done = true;
                    }
                    return result;
                }
            };
        }
    };
}
