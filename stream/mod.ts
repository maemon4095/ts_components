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