import { assert, assertEquals, unreachable } from "https://deno.land/std@0.215.0/assert/mod.ts";
import { unbounded } from "./unbounded.ts";
import { ChannelClosedError } from "./error.ts";

Deno.test("channel items must received in the same order", () => {
    const [sender, receiver] = unbounded<number>();

    let sendCount = 0;
    let receiveCount = 0;
    for (let n = 0; n < 100; ++n) {
        if (Math.random() >= 0.5) {
            sender.send(sendCount);
            sendCount++;
        } else {
            const expected = receiveCount;
            receiveCount++;
            receiver.receive().then(actual => {
                assertEquals(actual, expected);
            });
        }
    }
});

Deno.test("ChannelClosedError must be thrown when channel is closed while receiving", () => {
    const [sender, receiver] = unbounded<number>();
    (async () => {
        try {
            await receiver.receive();
            unreachable();
        } catch (e) {
            assert(e instanceof ChannelClosedError);
            assertEquals(e.message, "channel was closed while receiving.");
        }
    })();
    sender.close();
});

Deno.test("ChannelClosedError must be thrown when try to send on closed channel", async () => {
    const [sender] = unbounded<number>();
    sender.close();
    try {
        await sender.send(0);
        unreachable();
    } catch (e) {
        assert(e instanceof ChannelClosedError);
        assertEquals(e.message, "channel was closed while sending.");
    }
});