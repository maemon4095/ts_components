import { rawParse, RawArgs } from "./raw_parse.ts";
import { OneOfArgs } from "./scheme.ts";
import { ArgsScheme, ArgsSchemes, Args, validateInto } from "./scheme.ts";

export { rawParse, type RawArgs };
export type { ArgsScheme, ArgsSchemes, Args };
export * as scheme from "./scheme.ts";
export * as patterns from "./patterns.ts";

export function parse<S extends ArgsSchemes>(schemes: S, args: string[]): OneOfArgs<S> {
    const raw = rawParse(args);
    return validateInto(schemes, raw);
}