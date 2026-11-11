/** Community support ticket (task 1) */
export interface Ticket {
    id: number
    title: string
    priority: number
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