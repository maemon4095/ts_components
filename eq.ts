export const SymbolEquals: unique symbol = Symbol();
export type Equatable<T> = T & { [SymbolEquals](value: T): unknown; };

export function equals<T>(left: T, right: T): boolean {
    if (left === right) {
        return true;
    }

    if (typeof left !== "object" || typeof right !== "object") {
        return false;
    }

    // since left !== right, if one is null, then the other never be null.
    if (left === null || right === null) {
        return false;
    }

    if (left.constructor !== right.constructor) {
        return false;
    }

    if (isEquatable(left)) {
        return !!(left[SymbolEquals](right));
    }

    if (left.constructor !== Object && left.constructor !== Array) {
        return false;
    }

    const keys = new Set(keysOf(left).concat(keysOf(right)));
    for (const key of keys) {
        if (!equals(left[key], right[key])) {
            return false;
        }
    }

    return true;
}


export type Path<T> = T extends object ? [] | ({
    [key in keyof T]: [key, ...Path<T[key]>]
}[keyof T]) : [];

export type Member<T, P extends Path<T>> =
    P extends [infer X extends keyof T, ...infer R]
    ? (R extends Path<T[X]> ? Member<T[X], R> : never)
    : T;


export function assign<T, P extends Path<T> & [keyof T, ...unknown[]]>(target: T, path: P, value: Member<T, P>) {
    const last = path.pop();

    // deno-lint-ignore no-explicit-any
    let tmp: any = target;
    for (const p of path) {
        tmp = tmp[p];
    }

    tmp[last] = value;
}


export type DeltaType = "modify" | "delete" | "new";
export type Delta<T> = { path: Path<T>, type: DeltaType; };

export function* delta<T>(old: T, now: T): Generator<Delta<T>> {
    yield* deltaLimited(Number.POSITIVE_INFINITY, old, now);
}

export function* deltaLimited<T>(depth: number, old: T, now: T): Generator<Delta<T>> {
    if (old === now) {
        return;
    }

    if (old === undefined) {
        yield self("new");
        return;
    }

    if (now === undefined) {
        yield self("delete");
        return;
    }

    if (typeof old !== "object" || typeof now !== "object") {
        yield self("modify");
        return;
    }

    if (old === null || now === null) {
        yield self("modify");
        return;
    }

    if (old.constructor !== old.constructor) {
        yield self("modify");
        return;
    }

    if (isEquatable(old)) {
        if (!(old[SymbolEquals](now))) {
            yield self("modify");
        }
        return;
    }

    if (old.constructor !== Object && old.constructor !== Array) {
        yield self("modify");
        return;
    }

    if (depth <= 0) {
        if (!equals(old, now)) {
            yield self("modify");
        }
        return;
    }

    const keys = new Set(keysOf(old).concat(keysOf(now)));

    for (const key of keys) {
        for (const d of deltaLimited(depth - 1, old[key], now[key])) {
            yield { path: [key, ...d.path] as Path<T>, type: d.type };
        }
    }
    return;

    function self<T>(type: DeltaType): Delta<T> {
        return { path: [] as Path<T>, type };
    }
}

function keysOf<T>(value: T): (keyof T)[] {
    const names = Object.getOwnPropertyNames(value) as (keyof T)[];
    const symbols = Object.getOwnPropertySymbols(value) as (keyof T)[];

    return names.concat(symbols);
}

function isEquatable<T>(value: T): value is Equatable<T> {
    const comparer = (value as { [SymbolEquals]: unknown; })[SymbolEquals];
    return comparer instanceof Function;
}

