export type Unsubscriber = () => void;
export type Listener<T> = (v: T) => void;
export type EventSubscriber<T> = {
    subscribe(listener: Listener<T>): Unsubscriber;
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

    subscribe(listener: Listener<T>): Unsubscriber {
        const key = Symbol();
        this.#subs[key] = listener;
        return () => {
            delete this.#subs[key];
        };
    }
}