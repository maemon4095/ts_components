import { Optional, coalesce } from "./utilities.ts";

export type KeyOptions = {
    acceptsManyValue?: boolean,
};
export type ParseOptions = {
    keyMatcher: (arg: string) => boolean,
    defaultKeyOptions: KeyOptions,
    keySpecificOptions: {
        [key: string]: KeyOptions | undefined;
    };
};
export type ParseResult = { defaults: string[], mapping: { [key: string]: string[]; }; };

export const defaultParseOptions: ParseOptions = {
    keyMatcher: (arg: string) => arg.startsWith('-'),
    defaultKeyOptions: {
        acceptsManyValue: false,
    },
    keySpecificOptions: {}
};

export function parse(args: string[], options?: Optional<ParseOptions>): ParseResult {
    const defaults = [] as string[];
    const mapping: { [key: string]: string[]; } = {};
    const { keyMatcher, defaultKeyOptions, keySpecificOptions } = coalesce(options, defaultParseOptions);

    let key: string | null = null;
    let keyOptions = defaultKeyOptions;
    for (const arg of args) {
        if (keyMatcher(arg)) {
            key = arg;
            keyOptions = coalesce(keySpecificOptions[key], defaultKeyOptions);
            if (!mapping[key]) {
                mapping[key] = [];
            }
            continue;
        }
        if (key === null) {
            defaults.push(arg);
        } else {
            mapping[key].push(arg);
        }
        if (!keyOptions.acceptsManyValue) {
            key = null;
        }
    }
    return { defaults, mapping };
}
