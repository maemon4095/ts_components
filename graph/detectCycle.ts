import { DirectedAcyclicGraph, DirectedGraph, NodeId } from "./graphs.ts";

export function unsafeAssertAcyclic<N extends NodeId>(_graph: DirectedGraph<N>): asserts _graph is DirectedAcyclicGraph<N> { }
export function assertAcyclic<N extends NodeId>(graph: DirectedGraph<N>): asserts graph is DirectedAcyclicGraph<N> {
    const cycle = detectCycle(graph);
    if (cycle !== null) {
        throw new CycleDetectedError(cycle);
    }
}

export class CycleDetectedError<N extends NodeId> extends Error {
    readonly #cycle: readonly N[];

    constructor(cycle: readonly N[]) {
        super();
        this.#cycle = cycle;
        this.message = `${String(cycle[0])} and ${String(cycle.at(-1))} are interdependent`;
    }

    get cycle() {
        return this.#cycle;
    }
}

export function detectCycle<N extends NodeId>(graph: DirectedGraph<N>) {
    const unchecked = new Set(Object.keys(graph)) as Set<N>; // チェックしていないノードを記録する
    const indices = new Map(); // ノードがpathの中で何番目かを記録する
    for (const node of unchecked) {
        const path = [node]; // どのノードを辿ったか記録する
        indices.clear();
        indices.set(node, 0);
        const cycle = dfs(path, indices, unchecked);
        if (cycle !== null) return cycle;
    }
    return null;

    function dfs(path: N[], indices: Map<N, number>, unchecked: Set<N>): null | N[] {
        const head = path.at(-1)!;
        if (!unchecked.delete(head)) {// uncheckedに含まれない場合，既にサイクルが無いことを確認済み．
            return null;
        }
        for (const node of graph[head]) {
            const idx = indices.get(node);
            if (idx !== undefined) { // head はすでに通ったことがある -> サイクル
                return path.slice(idx); // サイクル部分のみ取り出し
            }

            indices.set(node, path.length);
            path.push(node);
            const cycle = dfs(path, indices, unchecked);
            indices.delete(node);
            path.pop();
            if (cycle !== null) return cycle;
        }
        return null;
    }
}