type MaybeMember<T, K> = K extends keyof T ? T[K] : undefined;
// type IsClassWithPrivateField<T> = { [key in keyof T]: T[key] } extends T ? false : true;

type Primitive = undefined | null | number | string | bigint | symbol;

export type Coalesced<T, U> =
    T extends undefined ? U :
    U extends undefined | null ? T :
    T extends Primitive ? T :
    U extends Primitive ? T :
    { [key in (keyof U | keyof T)]: Coalesced<MaybeMember<T, key>, MaybeMember<U, key>> };

export function coalesce<T, U>(value: T, defaults: U): Coalesced<T, U> {
    if (value === undefined) {
        return defaults as Coalesced<T, U>;
    }

    if (value === null || defaults === undefined || defaults === null) {
        return value as Coalesced<T, U>;
    }

    /* 型が付けられないため断念． 未練をここに残しておく． 
    // if value is not created from object literal, it is leaf and should not coalesced
    if (Object.getPrototypeOf(value) !== Object.prototype || Object.getPrototypeOf(defaults) !== Object.prototype) {
        return value as Coalesced<T, U>;
    }
    */

    if (typeof value !== "object" || typeof defaults !== "object") {
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

