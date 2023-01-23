export type ParseOptions = { keyMatcher: (arg: string) => boolean };
export type ParseResult = { defaults: string[], mapping: { [key: string]: string[] } };

export const defaultParseOptions: ParseOptions = { keyMatcher: (arg) => arg.startsWith('-') };

export function parse(args: string[], options?: ParseOptions): ParseResult {
    const defaults = [] as string[];
    const mapping = {};
    const opts = { ...defaultParseOptions, ...options };

    let key: string | null = null;
    for (const arg of args) {
        if (opts.keyMatcher(arg)) {
            key = arg;
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
        key = null;
    }

    return { defaults, mapping };
}