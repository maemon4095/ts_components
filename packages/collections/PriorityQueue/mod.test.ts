import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { PriorityQueue } from "./mod.ts";

Deno.test("PriorityQueue", () => {
    const queue = new PriorityQueue<number>();

    const testSize = 1000;
    const inserted: number[] = [];
    for (let i = 0; i < testSize; ++i) {
        const item = Math.random();
        inserted.push(item);
        queue.enqueue(item);
    }

    inserted.sort().reverse();
    for (let i = 0; i < inserted.length; ++i) {
        const expected = inserted[i];
        const actual = queue.dequeue();
        assertEquals(actual, expected);
    }

    assertEquals(queue.dequeue(), null);
});