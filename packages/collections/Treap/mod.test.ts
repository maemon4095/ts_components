import { assertEquals } from "https://deno.land/std@0.215.0/assert/mod.ts";
import { Treap } from "./mod.ts";

Deno.test("inserted items must be found and items not inserted must be missing", () => {
    const test_size = 1000;
    const treap = new Treap();
    const inserted = new Map();
    for (let test_nth = 0; test_nth < test_size; ++test_nth) {
        const v = Math.floor(Math.random() * test_size);
        assertEquals(treap.insert(v, v), !inserted.has(v));
        inserted.set(v, v);

        for (let search_nth = 0; search_nth < test_size; ++search_nth) {
            const v = Math.floor(Math.random() * test_size);
            assertEquals(treap.search(v), inserted.get(v));
        }
    }
});

Deno.test("inserted items must be found and removed item must be missing", () => {
    const test_size = 1000;
    const treap = new Treap();
    const inserted = new Map();
    for (let test_nth = 0; test_nth < test_size; ++test_nth) {
        const flg = Math.random();
        const v = Math.floor(Math.random() * test_size);
        if (flg < 0.5) {
            assertEquals(treap.insert(v, v), !inserted.has(v));
            inserted.set(v, v);
        } else {
            assertEquals(treap.remove(v), inserted.get(v));
            inserted.delete(v);
        }

        for (let search_nth = 0; search_nth < test_size; ++search_nth) {
            const v = Math.floor(Math.random() * test_size);
            assertEquals(treap.search(v), inserted.get(v));
        }
    }
});