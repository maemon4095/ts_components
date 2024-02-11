import { assertType, IsExact } from "https://deno.land/std@0.215.0/testing/types.ts";
import { assertThrows } from "https://deno.land/std@0.215.0/assert/assert_throws.ts";
import { assertEquals } from "https://deno.land/std@0.215.0/assert/assert_equals.ts";
import * as mod from "./scheme.ts";
import { rawParse } from "./raw_parse.ts";
import { ArgsScheme } from "./scheme.ts";

Deno.test("type", () => {
    const scheme = {
        positional: ["subcommand", mod.optional(mod.url)],
        options: {
            "-a": mod.optional(mod.url),
            "-b": mod.choice("a", mod.url),
            "-c": mod.str,
            "-d": mod.int
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

Deno.test("matches", () => {
    mod.matches("aaa", "aaa");
    assertThrows(() => {
        mod.matches("aaa", "bbb");
    });
    mod.matches(mod.int, "0");
    assertThrows(() => {
        mod.matches(mod.int, "bbb");
    });

    assertEquals(mod.matches(mod.optional("aaa"), "bbb"), null);
});

Deno.test("validateInto", () => {
    const scheme = {
        positional: ["subcommand", mod.optional(mod.url)],
        options: {
            "-a": mod.optional(mod.url),
            "-b": mod.choice("a", mod.url),
            "-c": mod.str,
            "-d": mod.int
        }
    } as const satisfies ArgsScheme;

    const raw = rawParse(["subcommand", "-b=a", "-c=str", "-d=0"]);

    const result = mod.validateInto(scheme, raw);

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

