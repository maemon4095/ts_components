import { assertEquals, assertThrows } from "jsr:@std/assert";
import { Arena, type ArenaId } from "./mod.ts";

Deno.test("Arena", () => {
    const arena = new Arena<number>();
    const map: Map<ArenaId, number> = new Map();
    const test_size = 1000;
    for (let i = 0; i < test_size; ++i) {
        if (Math.random() < 0.5) {
            const value = Math.random();
            const id = arena.alloc(value);
            map.set(id, value);
        } else {
            const id = Math.floor(Math.random() * map.size * 2) as ArenaId;
            if (map.has(id)) {
                arena.delete(id);
                map.delete(id);
            } else {
                assertThrows(() => arena.delete(id));
            }
        }
    }
    for (const [id, expected] of map) {
        const value = arena.get(id);
        assertEquals(value, expected);
    }
    for (let i = 0; i < test_size; ++i) {
        const id = Math.floor(Math.random() * map.size * 2) as ArenaId;
        const value = arena.get(id);
        const expected = map.get(id);
        assertEquals(value, expected);
    }
});