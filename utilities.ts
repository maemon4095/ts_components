export type Defined<T> = T extends undefined ? never : T;
export type RecursiveRequired<T> = {
    [P in keyof Defined<T>]-?: RecursiveRequired<Defined<T>[P]>
} & Defined<T>;

export type Optional<T> = {
    [P in keyof T]?: Optional<T[P]>
} | undefined;

