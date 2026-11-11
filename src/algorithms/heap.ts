import type {Ticket} from './types'

type Compare<T> = (a: T, b: T) => number

function swap<T>(arr: T[], i: number, j: number): void {
    const t = arr[i]!
    arr[i] = arr[j]!
    arr[j] = t
}

function siftDown<T>(arr: T[], n: number, i: number, cmp: Compare<T>): void {
    let largest = i
    const left = 2 * i + 1
    const right = 2 * i + 2
    if (left < n && cmp(arr[left]!, arr[largest]!) > 0) largest = left
    if (right < n && cmp(arr[right]!, arr[largest]!) > 0) largest = right
    if (largest !== i) {
        swap(arr, i, largest)
        siftDown<T>(arr, n, largest, cmp)
    }
}

function siftUp<T>(arr: T[], i: number, cmp: Compare<T>): void {
    let idx = i
    while (idx > 0) {
        const parent = Math.floor((idx - 1) / 2)
        if (cmp(arr[parent]!, arr[idx]!) >= 0) break
        swap(arr, parent, idx)
        idx = parent
    }
}

function buildHeap<T>(arr: T[], cmp: Compare<T>): T[] {
    const heap = [...arr]
    const n = heap.length
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        siftDown<T>(heap, n, i, cmp)
    }
    return heap
}

function heapSort<T>(arr: T[], cmp: Compare<T>): T[] {
    const a = buildHeap(arr, cmp)
    const result: T[] = []
    let n = a.length
    for (let i = n - 1; i > 0; i--) {
        swap(a, 0, i)
        result.push(a[i]!)
        n--
        siftDown<T>(a, n, 0, cmp)
    }
    if (n > 0) result.push(a[0]!)
    result.reverse()
    return result
}

export function insertIntoHeap<T>(heap: T[], value: T, cmp: Compare<T>): T[] {
    const h = [...heap]
    h.push(value)
    siftUp<T>(h, h.length - 1, cmp)
    return h
}

export function extractMax<T>(heap: T[], cmp: Compare<T>): [T[], T] | null {
    if (heap.length === 0) return null
    const h = [...heap]
    const max = h[0]!
    const last = h.pop()!
    if (h.length > 0) {
        h[0] = last
        siftDown<T>(h, h.length, 0, cmp)
    }
    return [h, max]
}

const cmpNumber: Compare<number> = (a, b) => a - b

export function buildPriorityHeap(priorities: number[]): number[] {
    return buildHeap(priorities, cmpNumber)
}

export function heapSortPriorities(priorities: number[]): number[] {
    return heapSort(priorities, cmpNumber)
}

const cmpNumberDesc: Compare<number> = (a, b) => b - a

export function heapSortPrioritiesDesc(priorities: number[]): number[] {
    return heapSort(priorities, cmpNumberDesc)
}

const cmpReport: Compare<Ticket> = (a, b) =>
    a.priority !== b.priority ? b.priority - a.priority : a.id - b.id

export function heapSortTickets(tickets: Ticket[]): Ticket[] {
    return heapSort(tickets.map((t) => ({...t})), cmpReport)
}

export function prioritiesOf(tickets: Ticket[]): number[] {
    return tickets.map((t) => t.priority)
}