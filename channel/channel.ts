// TODO: add trySend/tryReceive

export interface Sender<T> {
    /** start sending value to channel and wait. if channel is closed a exception will be thrown */
    send(value: T): Promise<void>;
    close(): void;
}

export interface Receiver<T> {
    /** start receiving value from channel and wait. if channel is closed a exception will be thrown */
    receive(): Promise<T>;
    close(): void;
}

