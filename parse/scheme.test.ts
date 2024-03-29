import { assertType, IsExact } from "https://deno.land/std@0.215.0/testing/types.ts";
import { assertThrows } from "https://deno.land/std@0.215.0/assert/assert_throws.ts";
import { assertEquals } from "https://deno.land/std@0.215.0/assert/assert_equals.ts";
import * as mod from "./scheme.ts";
import { rawParse } from "./raw_parse.ts";
import { ArgsScheme } from "./scheme.ts";
import * as pat from "./patterns.ts";
import { ArgsSchemes } from "./scheme.ts";

Deno.test("Args", () => {
    const scheme = {
        positional: ["subcommand", pat.optional(pat.url)],
        options: {
            "-a": pat.optional(pat.url),
            "-b": pat.choice("a", pat.url),
            "-c": pat.str,
            "-d": pat.int
        }
    } as const satisfies mod.ArgsScheme;

    type T = mod.Args<typeof scheme>;
    type E = {
        positional: ["subcommand", URL | null];
        options: {
            "-a": URL | null,
            "-b": "a" | URL,
            "-c": string,
            "-d": number;
        };
    };

    assertType<IsExact<T, E>>(true);
});


Deno.test("OneOfArgs", () => {
    const scheme = [
        {
            positional: ["subcommand", pat.optional(pat.url)],
            options: {
                "-a": pat.optional(pat.url),
                "-b": pat.choice("a", pat.url),
                "-c": pat.str,
                "-d": pat.int
            }
        }
    ] as const satisfies mod.ArgsSchemes;

    type T = mod.OneOfArgs<typeof scheme>;
    type E = readonly [0, {
        positional: ["subcommand", URL | null];
        options: {
            "-a": URL | null,
            "-b": "a" | URL,
            "-c": string,
            "-d": number;
        };
    }];

    assertType<IsExact<T, E>>(true);
});

Deno.test("matches", () => {
    mod.matches("aaa", "aaa");
    assertThrows(() => {
        mod.matches("aaa", "bbb");
    });
    mod.matches(pat.int, "0");
    assertThrows(() => {
        mod.matches(pat.int, "bbb");
    });

    assertEquals(mod.matches(pat.optional("aaa"), "bbb"), null);
});

Deno.test("singleValidateInto", () => {
    const scheme = {
        positional: ["subcommand", pat.optional(pat.url)],
        options: {
            "-a": pat.optional(pat.url),
            "-b": pat.choice("a", pat.url),
            "-c": pat.str,
            "-d": pat.int
        }
    } as const satisfies ArgsScheme;

    const raw = rawParse(["subcommand", "-b=a", "-c=str", "-d=0"]);

    const result = mod.singleValidateInto(scheme, raw);

    assertEquals(result, {
        positional: ["subcommand", null],
        options: {
            "-a": null,
            "-b": "a",
            "-c": "str",
            "-d": 0
        }
    });
});


Deno.test("validateInto", () => {
    const scheme = [
        {
            positional: ["command", pat.optional(pat.url)],
            options: {}
        },
        {
            positional: ["subcommand", pat.optional(pat.url)],
            options: {
                "-a": pat.optional(pat.url),
                "-b": pat.choice("a", pat.url),
                "-c": pat.str,
                "-d": pat.int
            }
        }
    ] as const satisfies ArgsSchemes;

    const raw = rawParse(["subcommand", "-b=a", "-c=str", "-d=0"]);

    const result = mod.validateInto(scheme, raw);

    assertEquals(result, [1, {
        positional: ["subcommand", null],
        options: {
            "-a": null,
            "-b": "a",
            "-c": "str",
            "-d": 0
        }
    }]);
});


Deno.test("option contain multiple equals", () => {
    const scheme = [
        {
            positional: [],
            options: {
                "--cache-from": pat.str
            }
        }
    ] as const satisfies ArgsSchemes;

    const raw = rawParse(["--cache-from=type=local,src=/tmp/.buildx-cache"]);
    const result = mod.validateInto(scheme, raw);

    assertEquals(result, [0, {
        positional: [],
        options: {
            "--cache-from": "type=local,src=/tmp/.buildx-cache"
        }
    }]);
});
