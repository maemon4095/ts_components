export type Defined<T> = T extends undefined ? never : T;
export type RecursiveRequired<T> = {
    [P in keyof Defined<T>]-?: RecursiveRequired<Defined<T>[P]>
} & Defined<T>;

export type Optional<T> = {
    [P in keyof T]?: Optional<T[P]>
} | undefined;

export function coalesce<T>(value: Optional<T>, defaults: T): T {
    if (value === undefined) {
        return defaults;
    }
    if (value === null) {
        return value;
    }

    if (defaults === undefined) {
        return value as T;
    }

    // if value is not created from object literal, it is leaf and should not coalesced
    if (Object.getPrototypeOf(defaults) !== Object.prototype) {
        if (value !== undefined) {
            return value as T;
        }
        return defaults;
    }

    if (defaults === null) {
        return value as T;
    }

    const keys = getOwnKeysOf(defaults as T);
    for (const key of keys) {
        if (value[key] !== undefined) {
            continue;
        }
        value[key] = coalesce(value[key], defaults[key]);
    }
    return value as T;
}


function getOwnKeysOf<T>(obj: T): (keyof T)[] {
    if (obj === null || obj === undefined) {
        return [];
    }
    const symbols = Object.getOwnPropertySymbols(obj) as (keyof T)[];
    const propNames = Object.getOwnPropertyNames(obj) as (keyof T)[];
    return symbols.concat(...propNames);
}

