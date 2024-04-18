import { Err, Ok, Result } from "../monadic/mod.ts";

export type Comparator<K> = (l: K, r: K) => number;

export class Treap<K, V> {
    #root?: Node<K, V>;
    readonly #comparator: Comparator<K>;

    constructor(comparator?: Comparator<K>) {
        this.#comparator = comparator ?? ((l, r) => {
            if (l === r) return 0;
            return l < r ? -1 : 1;
        });
    }

    search(key: K) {
        return this.#root?.search(this.#comparator, key);
    }

    insert(key: K, value: V) {
        const root = this.#root;
        if (root === undefined) {
            this.#root = new Node(key, value);
            return true;
        } else {
            const result = root.insert(this.#comparator, key, value);
            if (result === undefined) return false;
            this.#root = result;
            return true;
        }
    }

    remove(key: K): V | undefined {
        if (this.#root === undefined) return undefined;
        const result = this.#root.remove(this.#comparator, key);
        if (!result.isOk) {
            return undefined;
        }
        this.#root = result.value[1];
        return result.value[0];
    }
};

class Node<K, V> {
    readonly key: K;
    readonly value: V;
    readonly p: number;
    readonly #left: Node<K, V> | undefined;
    readonly #right: Node<K, V> | undefined;

    constructor(key: K, value: V, p?: number, left?: Node<K, V>, right?: Node<K, V>) {
        this.key = key;
        this.value = value;
        this.p = p ?? Math.random();
        this.#left = left;
        this.#right = right;
    }

    left(node: Node<K, V> | undefined): Node<K, V> {
        return new Node(this.key, this.value, this.p, node, this.#right);
    }

    right(node: Node<K, V> | undefined): Node<K, V> {
        return new Node(this.key, this.value, this.p, this.#left, node);
    }

    rotateL() {
        const right = this.#right;
        if (right === undefined) throw new Error("invalid operation");
        const left = this.right(right.#left);
        return right.left(left);
    }

    rotateR() {
        const left = this.#left;
        if (left === undefined) throw new Error("invalid operation");
        const right = this.left(left.#right);
        return left.right(right);
    }

    search(compare: Comparator<K>, key: K): V | undefined {
        const comparison = compare(key, this.key);
        if (comparison === 0) return this.value;
        if (comparison < 0) {
            return this.#left?.search(compare, key);
        } else {
            return this.#right?.search(compare, key);
        }
    }

    insert(compare: Comparator<K>, key: K, value: V): Node<K, V> | undefined {
        const comparison = compare(key, this.key);
        if (comparison === 0) return undefined;
        if (comparison < 0) {
            let left: Node<K, V>;
            if (this.#left === undefined) {
                left = new Node(key, value);
            } else {
                const result = this.#left.insert(compare, key, value);
                if (result === undefined) return undefined;
                left = result;
            }
            const me = this.left(left);
            return me.p < left.p ? me.rotateR() : me;
        } else {
            let right: Node<K, V>;
            if (this.#right === undefined) {
                right = new Node(key, value);
            } else {
                const result = this.#right.insert(compare, key, value);
                if (result === undefined) return undefined;
                right = result;
            }
            const me = this.right(right);
            return me.p < right.p ? me.rotateL() : me;
        }
    }

    remove(compare: Comparator<K>, key: K): Result<[V, Node<K, V> | undefined], void> {
        const comparsion = compare(key, this.key);
        if (comparsion === 0) {
            return Ok([this.value, this.#tricledownPop()]);
        }
        if (comparsion < 0) {
            if (this.#left === undefined) return Err();
            const result = this.#left.remove(compare, key);
            if (result.isOk) {
                return Ok([result.value[0], this.left(result.value[1])]);
            } else {
                return Err();
            }
        } else {
            if (this.#right === undefined) return Err();
            const result = this.#right.remove(compare, key);
            if (result.isOk) {
                return Ok([result.value[0], this.right(result.value[1])]);
            } else {
                return Err();
            }
        }
    };

    #tricledownPop(): Node<K, V> | undefined {
        const pop = (() => {
            const l = this.#left !== undefined;
            const r = this.#right !== undefined;
            if (l && r) {
                if (this.#left.p < this.#right.p) {
                    return "right";
                } else {
                    return "left";
                }
            }
            if (l) return "left";
            if (r) return "right";
            return undefined;
        })();

        switch (pop) {
            case "left": {
                const me = this.rotateR();
                return me.right(me.#right!.#tricledownPop());
            }
            case "right": {
                const me = this.rotateL();
                return me.left(me.#left!.#tricledownPop());
            }
            default: {
                return undefined;
            }
        }
    };
}

