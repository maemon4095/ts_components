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

    if (isEquatable(left)) {
        return !!(left[SymbolEquals](right));
    }

    if (left.constructor !== right.constructor) {
        return false;
    }

    if (left.constructor === Object || left.constructor === Array) {
        const keys = new Set(keysOf(left).concat(keysOf(right)));
        for (const key of keys) {
            if (!equals(left[key], right[key])) {
                return false;
            }
        }

        return true;
    }

    return false;
}

export type DeltaType = "modify" | "delete" | "new";
export type DeltaPath<T> = T extends object ? [] | [keyof T, ...DeltaPath<T[keyof T]>] : [];
export type Delta<T> = { path: DeltaPath<T>, type: DeltaType; };

export function* delta<T>(old: T, now: T): Generator<Delta<T>> {
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

    if (isEquatable(old)) {
        if (!(old[SymbolEquals](now))) {
            yield self("modify");
        }
        return;
    }

    if (old.constructor !== old.constructor) {
        yield self("modify");
        return;
    }

    if (old.constructor === Object || old.constructor === Array) {
        const keys = new Set(keysOf(old).concat(keysOf(now)));

        for (const key of keys) {
            for (const d of delta(old[key], now[key])) {
                yield { path: [key, ...d.path] as DeltaPath<T>, type: d.type };
            }
        }
        return;
    }

    yield self("modify");
    return;

    function self<T>(type: DeltaType): Delta<T> {
        return { path: [] as DeltaPath<T>, type };
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