import type {BstNode, Traversals, TreeStats} from './types'
import type {Ticket} from './types'

// Binary search tree

export function insert(root: BstNode | null, ticket: Ticket): BstNode {
    if (root === null) {
        return {ticket, left: null, right: null}
    }
    if (ticket.id < root.ticket.id) {
        root.left = insert(root.left, ticket)
    } else if (ticket.id > root.ticket.id) {
        root.right = insert(root.right, ticket)
    }

    return root
}

export function search(root: BstNode | null, id: number): Ticket | null {
    let cur = root
    while (cur !== null) {
        if (id === cur.ticket.id) return cur.ticket
        cur = id < cur.ticket.id ? cur.left : cur.right
    }
    return null
}

function minNode(node: BstNode): BstNode {
    let cur = node
    while (cur.left !== null) cur = cur.left
    return cur
}

export function remove(root: BstNode | null, id: number): BstNode | null {
    if (root === null) return null

    if (id < root.ticket.id) {
        root.left = remove(root.left, id)
    } else if (id > root.ticket.id) {
        root.right = remove(root.right, id)
    } else {

        if (root.left === null) return root.right
        if (root.right === null) return root.left

        const successor = minNode(root.right)
        root.ticket = successor.ticket
        root.right = remove(root.right, successor.ticket.id)
    }
    return root
}

export function preorder(root: BstNode | null, out: number[] = []): number[] {
    if (root === null) return out
    out.push(root.ticket.id)
    preorder(root.left, out)
    preorder(root.right, out)
    return out
}

export function inorder(root: BstNode | null, out: number[] = []): number[] {
    if (root === null) return out
    inorder(root.left, out)
    out.push(root.ticket.id)
    inorder(root.right, out)
    return out
}

export function postorder(root: BstNode | null, out: number[] = []): number[] {
    if (root === null) return out
    postorder(root.left, out)
    postorder(root.right, out)
    out.push(root.ticket.id)
    return out
}

export function levelOrder(root: BstNode | null): number[] {
    const out: number[] = []
    if (root === null) return out
    const queue: BstNode[] = [root]
    let head = 0
    while (head < queue.length) {
        const node = queue[head]!
        head++
        out.push(node.ticket.id)
        if (node.left !== null) queue.push(node.left)
        if (node.right !== null) queue.push(node.right)
    }
    return out
}

export function computeTraversals(root: BstNode | null): Traversals {
    return {
        preorder: preorder(root),
        inorder: inorder(root),
        postorder: postorder(root),
        levelOrder: levelOrder(root),
    }
}

export function toArray(root: BstNode | null): Ticket[] {
    if (root === null) return []
    const arr = toArray(root.left)
    arr.push(root.ticket)
    arr.push(...toArray(root.right))
    return arr
}

export function stats(root: BstNode | null): TreeStats {
    if (root === null) {
        return {nodeCount: 0, height: 0, leaves: 0, internalNodes: 0, isBst: true}
    }

    if (!isBst(root)) {
        return {
            nodeCount: count(root),
            height: height(root),
            leaves: leaves(root),
            internalNodes: count(root) - leaves(root),
            isBst: false
        }
    }
    return {
        nodeCount: count(root),
        height: height(root),
        leaves: leaves(root),
        internalNodes: count(root) - leaves(root),
        isBst: true,
    }
}

function count(root: BstNode | null): number {
    if (root === null) return 0
    return 1 + count(root.left) + count(root.right)
}

function height(root: BstNode | null): number {
    if (root === null) return -1
    return 1 + Math.max(height(root.left), height(root.right))
}

function leaves(root: BstNode | null): number {
    if (root === null) return 0
    if (root.left === null && root.right === null) return 1
    return leaves(root.left) + leaves(root.right)
}

export function isBst(root: BstNode | null): boolean {
    return isBstRange(root, -Infinity, Infinity)
}

function isBstRange(node: BstNode | null, min: number, max: number): boolean {
    if (node === null) return true
    const key = node.ticket.id
    if (key <= min || key >= max) return false
    return isBstRange(node.left, min, key) && isBstRange(node.right, key, max)
}

export function nodeCountByLevel(root: BstNode | null): number[] {
    const out: number[] = []
    if (root === null) return out
    const queue: BstNode[] = [root]
    while (queue.length > 0) {
        out.push(queue.length)
        const n = queue.length
        for (let i = 0; i < n; i++) {
            const node = queue.shift()!
            if (node.left !== null) queue.push(node.left)
            if (node.right !== null) queue.push(node.right)
        }
    }
    return out
}