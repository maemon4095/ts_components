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
            const [key, value] = arg.split("=", 2);
            if (value === undefined) {
                options[key] = null;
            } else {
                options[key] = value;
            }
        } else {
            positional.push(arg);
        }
    }

    return { positional, options };
}