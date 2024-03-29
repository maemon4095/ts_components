import { DirectedAcyclicGraph, DirectedGraph, NodeId } from "./graphs.ts";

export function extractPart<N extends NodeId>(targets: Iterable<N>, graph: DirectedAcyclicGraph<N>): DirectedAcyclicGraph<N>;
export function extractPart<N extends NodeId>(targets: Iterable<N>, graph: DirectedGraph<N>): DirectedGraph<N>;
export function extractPart<N extends NodeId>(targets: Iterable<N>, graph: DirectedGraph<N>): DirectedGraph<N> {
    const parts: { [name in N]?: Set<N>; } = {};

    for (const node of targets) {
        if (parts[node] !== undefined) {
            continue;
        }

        parts[node] = graph[node];

        const part = extractPart(graph[node], graph);
        for (const node in part) {
            if (parts[node] !== undefined) {
                continue;
            }

            parts[node] = part[node];
        }
    }

    return parts as DirectedGraph<N>;
}
