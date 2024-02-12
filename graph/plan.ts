import { DirectedAcyclicGraph, NodeId } from "./graphs.ts";

export interface Plan<N extends NodeId> {
    get current(): N[];
    next(done: N): boolean;
}

export function createPlan<N extends NodeId>(graph: DirectedAcyclicGraph<N>): Plan<N> {
    const roots: N[] = [];
    const depsClone: { [name in N]?: Set<N>; } = {};
    const dependants: { [name in N]?: Set<N>; } = {};
    let _nodeCnt = 0;
    for (const node in graph) {
        const ds = graph[node];
        _nodeCnt += 1;
        depsClone[node] = new Set(ds);
        if (ds.size === 0) {
            roots.push(node);
            continue;
        }
        for (const d of ds) {
            const ds = dependants[d] ??= new Set();
            ds.add(node);
        }
    }

    return new class implements Plan<N> {
        #current: N[];
        #deps: DirectedAcyclicGraph<N>;
        constructor() {
            this.#current = roots;
            this.#deps = depsClone as DirectedAcyclicGraph<N>;
        }

        get current(): N[] {
            return this.#current;
        }
        next(done: N): boolean {
            if (this.#deps[done]?.size !== 0) {
                // 他のタスクに依存しているタスクが先に実行された
                throw new InvalidOrderExecutionError(done);
            }
            delete this.#deps[done]; // 完了したタスクを削除

            const candidates = dependants[done];
            const next: N[] = [];
            if (candidates !== undefined) {
                for (const candidate of candidates) {
                    const ds = this.#deps[candidate];
                    ds.delete(done);
                    if (ds.size === 0) {
                        next.push(candidate);
                    }
                }
            }
            this.#current = next;
            return Object.keys(this.#deps).length > 0;
        }
    };
}

export class InvalidOrderExecutionError<N extends NodeId> extends Error {
    #task;
    constructor(task: N) {
        super();
        this.#task = task;
        this.message = `The task(${String(task)}) was executed before the dependent task finished.`;
    }

    get task() {
        return this.#task;
    }
}