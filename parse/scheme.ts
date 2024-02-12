import { RawArgs } from "./raw_parse.ts";

export type Arg = string | null | undefined;

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

export function singleValidateInto<S extends ArgsScheme>(scheme: S, args: RawArgs): Args<S> {
    const { positional: positionalScheme, options: optionsScheme } = scheme;
    const { positional, options } = args;
    let positionalOut;
    const optionsOut: { [key: string]: unknown; } = {};

    if (positionalScheme instanceof Array) {
        const p = [];
        if (positional.length > positionalScheme.length) {
            throw new UnexpectetPositionalArgumentError();
        }

        for (let i = 0; i < positionalScheme.length; ++i) {
            p.push(matches(positionalScheme[i], positional[i]));
        }

        positionalOut = p;
    } else {
        if (positional.length > 1) {
            throw new UnexpectetPositionalArgumentError();
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

export function validateInto<S extends ArgsSchemes>(schemes: S, args: RawArgs): OneOfArgs<S> {
    let last_err;
    let idx = 0;
    for (const scheme of schemes) {
        try {
            return [idx, singleValidateInto(scheme, args)] as const as OneOfArgs<S>;
        } catch (e) {
            last_err = e;
        }
        idx += 1;
    }
    throw last_err;
}

export class UnexpectetPositionalArgumentError extends Error {
    message = "unexpected positional argument";
}

/** if arg is undefined, it means no such argument given.
 * 
 *  if arg is null, it means option without value given.
 */
export type Pattern = string | ((arg: string | undefined | null) => unknown);
export type ArgsScheme = {
    readonly positional: Pattern | readonly Pattern[];
    readonly options: { readonly [key: `-${string}`]: Pattern; };
};

export type ArgsSchemes = readonly ArgsScheme[];

export type OneOfArgs<S extends ArgsSchemes> = S extends readonly [...infer H extends readonly ArgsScheme[], infer X extends ArgsScheme] ? OneOfArgs<H> | readonly [H["length"], Args<X>] : never;

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
