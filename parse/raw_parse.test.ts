import { assertEquals } from "https://deno.land/std@0.215.0/assert/mod.ts";
import * as mod from "./raw_parse.ts";

Deno.test("test parse", () => {
    const result = mod.rawParse(["positional", "-flag", "-key=value"]);

    assertEquals(result, { positional: ["positional"], options: { ["-flag"]: null, "-key": "value" } });
});