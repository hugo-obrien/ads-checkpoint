/** Community support ticket (task 1) */
export interface Ticket {
    id: number
    title: string
    priority: number
}

/** Educational equipment registry record (task 2) */
export interface Equipment {
    id: number
    name: string
    room: string
    status: string
}

export type CollisionMethod =
    | 'chaining'
    | 'linear'
    | 'quadratic'
    | 'double'

export interface ChainBucket {
    bucket: number
    items: Equipment[]
    comparisons: number
}

export interface OpenSlot {
    index: number
    occupied: boolean
    deleted: boolean
    item: Equipment | null
}

export interface HashStats {
    size: number
    capacity: number
    loadFactor: number
    collisions: number
    comparisons: number
    maxChain: number
    avgChain: number
}

/** Binary search tree node */
export interface BstNode {
    ticket: Ticket
    left: BstNode | null
    right: BstNode | null
}

export interface TreeStats {
    nodeCount: number
    height: number
    leaves: number
    internalNodes: number

    isBst: boolean
}

export interface Traversals {
    preorder: number[]
    inorder: number[]
    postorder: number[]
    levelOrder: number[]
}

export interface GraphNode {
    id: number
    label: string
}

export interface GraphEdge {
    from: number
    to: number
    weight: number
}

export interface AdjacencyList {
    nodes: Map<number, Array<{ to: number; weight: number }>>
}

export interface GraphStats {
    nodeCount: number
    edgeCount: number
    components: number
    cycles: boolean
    maxDegree: number
    avgDegree: number
    connected: boolean
}

export interface PathResult {
    path: number[]
    distance: number
    visitOrder: number[]
    found: boolean
}

export interface DijkstraResult {
    source: number
    distances: Record<number, number>
    previous: Record<number, number | null>
}

export interface MstResult {
    edges: GraphEdge[]
    totalWeight: number
    inMst: Array<{ from: number; to: number }>
}