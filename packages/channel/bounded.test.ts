import { assert, assertEquals, unreachable } from "https://deno.land/std@0.215.0/assert/mod.ts";
import { bounded } from "./bounded.ts";
import { ChannelClosedError } from "./error.ts";

Deno.test("channel items must received in the same order", () => {
    const [sender, receiver] = bounded<number>(16);

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

Deno.test("zero size channel items must received in the same order", async () => {
    const [sender, receiver] = bounded<number>(0);
    const count = 100;
    const send = async () => {
        for (let sent = 0; sent < count; ++sent) {
            await sender.send(sent);
        }
        sender.close();
    };
    const receive = async () => {
        let received = 0;
        try {
            while (true) {
                const item = await receiver.receive();
                assertEquals(item, received);
                received++;
            }
        } catch (e) {
            assert(e instanceof ChannelClosedError);
            assertEquals(received, count);
        }
    };

    await Promise.all([receive(), send()]);
});

Deno.test("ChannelClosedError must be thrown when channel is closed while receiving", () => {
    const [sender, receiver] = bounded<number>(32);
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
    const [sender] = bounded<number>(32);
    sender.close();
    try {
        await sender.send(0);
        unreachable();
    } catch (e) {
        assert(e instanceof ChannelClosedError);
        assertEquals(e.message, "channel was closed while sending.");
    }
});