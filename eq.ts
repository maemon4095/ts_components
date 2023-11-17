export function equals(left: unknown, right: unknown): boolean {
    if (typeof left !== typeof right) {
        return false;
    }

    if (typeof left !== "object") {
        return left === right;
    }

    assert<NonNullOrUndefined | null>(right);

    if (left === null) {
        return right === null;
    }
    if (right === null) {
        return false;
    }

    if (left.constructor !== right.constructor) {
        return false;
    }

    if (left.constructor === Object || left.constructor === Array) {
        // check right is left
        for (const name of Object.getOwnPropertyNames(left) as (keyof typeof left)[]) {
            if (!equals(left[name], right[name])) {
                return false;
            }
        }

        for (const name of Object.getOwnPropertySymbols(left) as (keyof typeof left)[]) {
            if (!equals(left[name], right[name])) {
                return false;
            }
        }

        // check left is right
        for (const name of Object.getOwnPropertyNames(right) as (keyof typeof right)[]) {
            if (!equals(left[name], right[name])) {
                return false;
            }
        }

        for (const name of Object.getOwnPropertySymbols(right) as (keyof typeof right)[]) {
            if (!equals(left[name], right[name])) {
                return false;
            }
        }

        return true;
    }

    return left === right;
}

// deno-lint-ignore ban-types
type NonNullOrUndefined = {};
function assert<T>(_v: unknown): asserts _v is T { }