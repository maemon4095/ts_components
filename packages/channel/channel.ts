import { Result } from "@maemon4095/result";

export type TrySendError = "closed" | "full";
export type TryReceiveError = "closed" | "empty";

export interface Sender<T> {
    /** try to send value immediately. */
    trySend(value: T): Result<void, TrySendError>;
    /** start sending value to channel and wait. if channel is closed a exception will be thrown */
    send(value: T): Promise<void>;
    close(): void;
}

export interface Receiver<T> {
    /** try to receive value immediately. */
    tryReceive(): Result<T, TryReceiveError>;
    /** start receiving value from channel and wait. if channel is closed a exception will be thrown */
    receive(): Promise<T>;
    close(): void;
}

