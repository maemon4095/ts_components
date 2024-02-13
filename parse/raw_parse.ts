export type RawArgs = {
    positional: string[];
    options: { [key: string]: string | null; };
};
/** parse string array.
 * 
 *  e.g.) the input `positional -flag -key=value` into `{ positional: ["positional"], options: { ["-flag"]: true, ["-key"]: "value" } }`  
 *  
 *  if you want to validate input, use ts_components/parse/scheme
 */
export function rawParse(args: string[]): RawArgs {
    const options: { [key: string]: string | null; } = {};
    const positional: string[] = [];

    for (const arg of args) {
        if (arg.startsWith("-")) {
            const idx = arg.indexOf("=");
            if (idx < 0) {
                options[arg] = null;
                break;
            }

            const key = arg.substring(0, idx);
            const value = arg.substring(idx + 1);
            options[key] = value;
        } else {
            positional.push(arg);
        }
    }

    return { positional, options };
}