export type NodeId = string | symbol | number;
export type DirectedGraph<Node extends NodeId> = { [node in Node]: Set<Node>; };

// deno-lint-ignore no-unused-vars
class DirectedAcyclicGraphMark {
    readonly #mark: symbol = Symbol();
}
export type DirectedAcyclicGraph<N extends NodeId> = DirectedAcyclicGraphMark & DirectedGraph<N>;
