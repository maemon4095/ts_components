import { RawArgs } from "./raw_parse.ts";

export type Arg = string | null | undefined;

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

export function matches<P extends Pattern>(pattern: P, arg: Arg): Match<P> {
    if (typeof pattern === "string") {
        if (arg === pattern) {
            return arg as Match<P>;
        } else {
            throw new StringLiteralExpectedError(pattern);
        }
    } else {
        return pattern(arg) as Match<P>;
    }
}

export class StringLiteralExpectedError extends Error {
    constructor(literal: string) {
        super();
        this.message = `\`${literal}\` was expected`;
    }
}

export function validateInto<S extends ArgsScheme>(scheme: S, args: RawArgs): Args<S> {
    const { positional: positionalScheme, options: optionsScheme } = scheme;
    const { positional, options } = args;
    let positionalOut;
    const optionsOut: { [key: string]: unknown; } = {};


    if (positionalScheme instanceof Array) {
        const p = [];
        if (positional.length > positionalScheme.length) {
            throw new Error();
        }

        for (let i = 0; i < positionalScheme.length; ++i) {
            p.push(matches(positionalScheme[i], positional[i]));
        }

        positionalOut = p;
    } else {
        if (positional.length > 1) {
            throw new Error();
        }

        positionalOut = matches(positionalScheme, positional[0]);
    }

    const optionKeys = new Set(Object.keys(optionsScheme).concat(Object.keys(options)));

    for (const option of optionKeys) {
        if (!(option in optionsScheme)) {
            throw new Error();
        }
        optionsOut[option] = matches(optionsScheme[option as `-${string}`], options[option]);
    }

    return {
        positional: positionalOut,
        options: optionsOut
    } as Args<S>;
}

/** if arg is undefined, it means no such argument given.
 * 
 *  if arg is null, it means option without value given.
 */
export type Pattern = string | ((arg: string | undefined | null) => unknown);
export type ArgsScheme = {
    positional: Pattern | readonly Pattern[];
    options: { [key: `-${string}`]: Pattern; };
};

export type Args<T extends ArgsScheme> = {
    positional: Match<T["positional"]>;
    options: {
        [key in keyof T["options"]]: Match<Assert<T["options"][key], Pattern>>;
    };
};

type Assert<T, U> = T extends U ? T : never;
export type Match<T extends (Pattern | readonly Pattern[])> =
    T extends readonly Pattern[] ? Joined<T> :
    T extends Pattern ? MatchAtom<T> :
    never;

type Joined<A extends readonly Pattern[]> = A extends readonly [infer X extends Pattern, ...infer R extends readonly Pattern[]] ? [MatchAtom<X>, ...Joined<R>] : [];

type MatchAtom<T extends Pattern> =
    T extends string ? T :
    T extends (arg: string) => infer X ?
    /**/ ((arg: string | null | undefined) => X) extends T ? X : never // to prevent passing unintended functions. Example below.
    : never;
