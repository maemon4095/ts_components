export type Immutable<T> =
    T extends boolean ? boolean :
    T extends number ? number :
    T extends string ? string :
    T extends undefined ? undefined :
    T extends null ? null :
    T extends symbol ? symbol :
    T extends bigint ? bigint :
    T extends Array<infer X> ? ReadonlyArray<X> :
    { readonly [key in keyof T]: Immutable<T[key]> };