export class Subscription {
    #symbol;
    constructor(symbol: symbol) {
        this.#symbol = symbol;
    }

    __internal_get_key(): symbol {
        return this.#symbol;
    }
}

export type Listener<T> = (v: T) => void;
export type EventSubscriber<T> = {
    subscribe(listener: Listener<T>): Subscription;
    unsubscribe(subscription: Subscription): void;
};

export class EventHub<T> implements EventSubscriber<T> {
    #subs: { [key: symbol]: Listener<T>; };
    constructor() {
        this.#subs = {};
    }

    dispatch(event: T) {
        const subs = this.#subs;
        for (const key of Object.getOwnPropertySymbols(subs)) {
            subs[key](event);
        }
    }

    subscribe(listener: Listener<T>) {
        const key = Symbol();
        this.#subs[key] = listener;
        return new Subscription(key);
    }

    unsubscribe(subscription: Subscription) {
        delete this.#subs[subscription.__internal_get_key()];
    }
}