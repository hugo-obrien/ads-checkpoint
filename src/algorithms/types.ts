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