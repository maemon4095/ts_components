export type Ok<T> = { isOk: true, value: T; };
export type Err<E> = { isOk: false, err: E; };
export type Result<T, E> = Ok<T> | Err<E>;