import { assertEquals, assert } from "https://deno.land/std@0.211.0/assert/mod.ts";
import { coalesce } from "../coalesce.ts";


Deno.test("coalesce", async (ctx) => {
    await ctx.step("with empty", () => {
        const putty = {};
        const input = { a: "a", b: "" };
        const output = coalesce(input, putty);

        // assert output is new object
        assert(input !== output);
        assertEquals(output, input);
    });

    await ctx.step("with null", () => {
        const putty = null;
        const input = { a: "a", b: "" };
        const output = coalesce(input, putty);

        assert(input === output);
        assertEquals(output, input);
    });

    await ctx.step("with undefined", () => {
        const putty = undefined;
        const input = { a: "a", b: "" };
        const output = coalesce(input, putty);

        assert(input === output);
        assertEquals(output, input);
    });

    await ctx.step("nested", () => {
        const putty = { b: { c: "putty" } };
        const input = { a: "a", b: {} };
        const output = coalesce(input, putty);

        assertEquals(output, { a: "a", b: { c: "putty" } });
    });

    await ctx.step("array", () => {
        const putty = { b: { c: "putty" } };
        const input = { a: "a", b: [] };
        const output = coalesce(input, putty);

        assertEquals(output, { a: "a", b: [] });
    });
});