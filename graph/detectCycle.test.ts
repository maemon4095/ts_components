import { detectCycle } from "./detectCycle.ts";
import { assertEquals, } from "https://deno.land/std@0.219.1/assert/mod.ts";

Deno.test("detectCycle returns cycle if cycle exists", () => {
    const graph = {
        a: new Set(["b", "c"]),
        b: new Set(["d"]),
        c: new Set(["d", "e"]),
        d: new Set([]),
        e: new Set(["a"]),
        f: new Set(["c"]),
        g: new Set(["e"])
    } as const;

    const cycle = detectCycle(graph);
    assertEquals(cycle, ["a", "c", "e"]);
});

Deno.test("detectCycle returns null if cycle does not exists", () => {
    const graph = {
        a: new Set(["b", "c"]),
        b: new Set(["d"]),
        c: new Set(["d", "e"]),
        d: new Set([]),
        e: new Set([]),
        f: new Set(["c"]),
        g: new Set(["e"])
    } as const;

    const cycle = detectCycle(graph);
    assertEquals(cycle, null);
});