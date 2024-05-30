export class PriorityQueue<T> {
    #comparator: Comparator<T>;
    #entries: T[];

    constructor(comparator?: Comparator<T>) {
        comparator ??= (l, r) => l === r ? 0 : l < r ? -1 : 1;
        this.#comparator = comparator;
        this.#entries = [];
    }

    enqueue(value: T): void {
        const entries = this.#entries;
        let idx = entries.length;
        entries.push(value);
        const comparator = this.#comparator;
        while (idx > 0) {
            const parentIdx = parentOf(idx);
            if (comparator(value, entries[parentIdx]) <= 0) {
                // parent greater than or equal to value.
                break;
            }
            swap(entries, parentIdx, idx);
            idx = parentIdx;
        }
    }

    dequeue(): T | null {
        const entries = this.#entries;
        if (entries.length === 0) {
            return null;
        }
        if (entries.length === 1) {
            return entries.pop()!;
        }
        const comparator = this.#comparator;
        const item = entries[0];
        const last = entries[entries.length - 1];
        entries[0] = last;
        entries.pop();

        const length = entries.length;
        let idx = 0;
        while (true) {
            const idxL = leftOf(idx);
            const idxR = rightOf(idx);

            if (idxL >= length) {
                break;
            }
            const left = entries[idxL];
            if (idxR >= length) {
                if (comparator(last, left) < 0) {
                    swap(entries, idx, idxL);
                }
                break;
            }
            const right = entries[idxR];

            if (comparator(left, right) < 0) {
                if (comparator(last, right) >= 0) {
                    break;
                }
                swap(entries, idx, idxR);
                idx = idxR;
            } else {
                if (comparator(last, left) >= 0) {
                    break;
                }
                swap(entries, idx, idxL);
                idx = idxL;
            }
        }

        return item;
    }
}

function swap<T>(arr: T[], idx0: number, idx1: number) {
    const tmp = arr[idx0];
    arr[idx0] = arr[idx1];
    arr[idx1] = tmp;
}

function leftOf(idx: number) {
    return (idx + 1) * 2 - 1;
}

function rightOf(idx: number) {
    return (idx + 1) * 2;
}

/** if negetive, node is root (no parents).  */
function parentOf(idx: number) {
    return Math.floor((idx + 1) / 2) - 1;
}

type Comparator<T> = (l: T, r: T) => number;