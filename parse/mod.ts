import { rawParse, RawArgs } from "./raw_parse.ts";
import { ArgsScheme, Args, validateInto } from "./scheme.ts";

export { rawParse, type RawArgs };
export * as scheme from "./scheme.ts";

export function parse<S extends ArgsScheme>(scheme: S, args: string[]): Args<S> {
    const raw = rawParse(args);
    return validateInto(scheme, raw);
}