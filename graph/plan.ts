import { DirectedAcyclicGraph, NodeId } from "./graphs.ts";

export interface Plan<N extends NodeId> {
    next(done: N | undefined): { done: false, value: N[]; } | { done: true; };
}

export function createPlan<N extends NodeId>(graph: DirectedAcyclicGraph<N>): Plan<N> {
    const roots: N[] = [];
    const depsClone: { [name in N]?: Set<N>; } = {};
    const dependants: { [name in N]?: Set<N>; } = {};
    for (const node in graph) {
        const ds = graph[node];
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
        #deps: DirectedAcyclicGraph<N>;
        constructor() {
            this.#deps = depsClone as DirectedAcyclicGraph<N>;
        }

        next(done: N | undefined): { done: false, value: N[]; } | { done: true; } {
            if (done === undefined) {
                if (roots.length === 0) {
                    return { done: true };
                }
                return { done: false, value: roots };
            }

            if (this.#deps[done]?.size !== 0) {
                // 他のタスクに依存しているタスクが先に実行された
                throw new InvalidOrderExecutionError(done);
            }
            delete this.#deps[done]; // 完了したタスクを削除

            if (Object.keys(this.#deps).length === 0) {
                return { done: true };
            }

            const candidates = dependants[done];
            const value: N[] = [];
            if (candidates !== undefined) {
                for (const candidate of candidates) {
                    const ds = this.#deps[candidate];
                    ds.delete(done);
                    if (ds.size === 0) {
                        value.push(candidate);
                    }
                }
            }
            return { done: false, value };
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