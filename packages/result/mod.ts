export type Ok<T> = { isOk: true, value: T; };
export type Err<E> = { isOk: false, err: E; };
export type Result<T, E> = Ok<T> | Err<E>;

export function Ok(): Ok<void>;
export function Ok<T>(value: T): Ok<T>;
export function Ok<T>(value?: T): Ok<T> {
    return { isOk: true, value: value! };
}

export function Err(): Err<void>;
export function Err<E>(err: E): Err<E>;
export function Err<E>(err?: E): Err<E> {
    return { isOk: false, err: err! };
}