import { ListQueue } from "./ListQueue.ts";
import { assert, assertEquals } from "https://deno.land/std@0.215.0/assert/mod.ts";

Deno.test("ListQueue", () => {
    for (let test_nth = 0; test_nth < 100; test_nth++) {
        const count = Math.floor(Math.random() * 100);
        const queue = new ListQueue();
        assert(queue.isEmpty);

        for (let n = 0; n < count; ++n) {
            queue.enqueue(n);
        }

        for (let n = 0; n < count; ++n) {
            assertEquals(queue.dequeue(), n);
        }

        assert(queue.isEmpty);
    }
});