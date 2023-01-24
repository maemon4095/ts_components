export type Defined<T> = T extends undefined ? never : T;
export type RecursiveRequired<T> = {
    [P in keyof Defined<T>]-?: RecursiveRequired<Defined<T>[P]>
} & Defined<T>;

export type Optional<T> = {
    [P in keyof T]?: Optional<T[P]>
} | undefined;

export function deepCoalesce<T>(value: Optional<T>, defaults: T): T {
    if (value === undefined || value === null) {
        return defaults;
    }
    if (defaults === undefined || defaults === null) {
        return value as T;
    }

    if (typeof value !== "object") {
        return value;
    }
    const obj: Partial<T> = {};
    const keys = getOwnKeysOf(value).concat(getOwnKeysOf(defaults) as (keyof T)[]);
    for (const key of keys) {
        if (obj[key] !== undefined) {
            continue;
        }
        obj[key] = deepCoalesce(value[key], defaults[key]);
    }
    return obj as T;
}

export function coalesce<T>(value: Partial<T>, defaults: T): T {
    return { ...value, ...defaults };
}

function getOwnKeysOf<T>(obj: T): (keyof T)[] {
    if (obj === null || obj === undefined) {
        return [];
    }
    const symbols = Object.getOwnPropertySymbols(obj) as (keyof T)[];
    const propNames = Object.getOwnPropertyNames(obj) as (keyof T)[];
    return symbols.concat(...propNames);
}

