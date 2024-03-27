export class ChannelClosedError extends Error {
    static sending(): ChannelClosedError {
        return new ChannelClosedError("channel was closed while sending.");
    }

    static receiving(): ChannelClosedError {
        return new ChannelClosedError("channel was closed while receiving.");
    }

    readonly message: string;
    readonly name: string;
    private constructor(msg: string) {
        super();
        this.message = msg;
        this.name = ChannelClosedError.name;
    }
}