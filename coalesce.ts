type MaybeMember<T, K> = K extends keyof T ? T[K] : undefined;


export type Coalesced<T, U> =
    T extends undefined ? U :
    // deno-lint-ignore ban-types
    T extends { ["constructor"]: Function; } ? T :
    // deno-lint-ignore ban-types
    U extends { ["constructor"]: Function; } ? T :
    T & { [key in Exclude<keyof U, keyof T>]: Coalesced<MaybeMember<T, key>, U[key]> };

export function coalesce<T, U>(value: T, defaults: U): Coalesced<T, U> {
    if (value === undefined) {
        return defaults as Coalesced<T, U>;
    }

    if (value === null || defaults === undefined || defaults === null) {
        return value as Coalesced<T, U>;
    }

    // if value is not created from object literal, it is leaf and should not coalesced
    if (Object.getPrototypeOf(value) !== Object.prototype || Object.getPrototypeOf(defaults) !== Object.prototype) {
        return value as Coalesced<T, U>;
    }

    // deno-lint-ignore no-explicit-any
    const result: any = { ...value };
    const keys = getOwnKeysOf(defaults);
    for (const key of keys) {
        result[key] = coalesce(result[key], defaults[key]);
    }
    return result as Coalesced<T, U>;
}

function getOwnKeysOf<T>(obj: T): (keyof T)[] {
    if (obj === null || obj === undefined) {
        return [];
    }
    const symbols = Object.getOwnPropertySymbols(obj) as (keyof T)[];
    const propNames = Object.getOwnPropertyNames(obj) as (keyof T)[];
    return symbols.concat(...propNames);
}

