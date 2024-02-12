import { DirectedAcyclicGraph, DirectedGraph, NodeId } from "./graphs.ts";

export function unsafeAssertAcyclic<N extends NodeId>(_graph: DirectedGraph<N>): asserts _graph is DirectedAcyclicGraph<N> { }
export function assertAcyclic<N extends NodeId>(graph: DirectedGraph<N>): asserts graph is DirectedAcyclicGraph<N> {
    const cycle = detectCycle(graph);
    if (cycle !== null) {
        throw new CycleDetectedError(cycle);
    }
}

export function detectCycle<N extends NodeId>(graph: DirectedGraph<N>) {
    const indices = new Map(); // ノードがpathの中で何番目かを記録する
    const checked = new Set<N>(); // ノードから繋がる部分にサイクルが無いことを記録する
    for (const node in graph) {
        indices.clear();
        const path = [node]; // どのノードを辿ったか記録する
        indices.set(node, 0);

        const cycle = dfs(graph, path, indices, checked);
        if (cycle !== null) return cycle;
    }
    return null;

    function dfs(graph: DirectedGraph<N>, path: N[], indices: Map<N, number>, checked: Set<N>): null | N[] {
        const head = path.at(-1)!;
        if (checked.has(head)) return null; // head から繋がる部分はサイクルが無いことをチェック済み
        for (const next of graph[head]) {
            const idx = indices.get(next);
            if (idx !== undefined) { // head はすでに通ったことがある -> サイクル
                return path.slice(idx); // サイクル部分のみ取り出し
            }

            indices.set(next, path.length);
            path.push(next);
            const cycle = dfs(graph, path, indices, checked);
            indices.delete(next);
            path.pop();
            if (cycle !== null) return cycle;
        }

        checked.add(head); // head から繋がる部分にサイクルは無いことを記録
        return null;
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
