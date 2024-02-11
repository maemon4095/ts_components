import { Arg, Match, Pattern, matches } from "./scheme.ts";

export function url(arg: Arg): URL {
    return new URL(arg!);
}

export function str(arg: Arg): string {
    if (typeof arg === "string")
        return arg;
    throw new StringExpectedError();
}

export class StringExpectedError extends Error {
    message = "string was expected";
}

export function int(arg: Arg): number {
    if (typeof arg === "string") {
        const n = parseInt(arg);
        if (!isNaN(n)) {
            return n;
        }
    }
    throw new IntegerExpectedError();
}
export class IntegerExpectedError extends Error {
    message = "integer was expected";
}

export function optional<P extends Pattern>(p: P) {
    return (arg: Arg) => {
        try {
            return matches(p, arg);
        } catch (_) {
            return null;
        }
    };
}
export function choice<P extends Pattern[]>(...ps: P): (arg: Arg) => Match<P[number]> {
    return (arg: Arg) => {
        let last_error;
        for (const p of ps) {
            try {
                return matches(p, arg) as Match<P[number]>;
            } catch (e) {
                last_error = e;
                continue;
            }
        }
        throw new NoChoiceMatchedError(last_error);
    };
}

export class NoChoiceMatchedError extends Error {
    message = "no choice was matched";
    constructor(last_err: Error) {
        super();
        this.cause = last_err;
    }
}
