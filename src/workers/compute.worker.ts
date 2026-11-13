import type {WorkerRequest, WorkerResponse} from './workerMessages'
import {buildPriorityHeap, heapSortPrioritiesDesc} from '@core/algorithms/heap'
import {buildTable} from '@core/algorithms/hash'
import {buildAdjacency, kruskalMst, shortestPath} from '@core/algorithms/graph'
import type {CollisionMethod, Equipment, GraphEdge} from '@core/algorithms/types'

function run<T>(task: string, payload: T): unknown {
    switch (task) {
        case 'build-heap':
            return buildPriorityHeap((payload as { priorities: number[] }).priorities)
        case 'heap-sort':
            return heapSortPrioritiesDesc((payload as { priorities: number[] }).priorities)
        case 'build-hash-table': {
            const p = payload as { items: Equipment[]; capacity: number; method: CollisionMethod }
            const {stats} = buildTable(p.items, p.capacity, p.method)
            return {stats}
        }
        case 'compute-shortest': {
            const p = payload as { nodeIds: number[]; edges: GraphEdge[]; source: number; target: number }
            const adj = buildAdjacency(p.nodeIds, p.edges)
            return {shortest: shortestPath(adj, p.source, p.target)}
        }
        case 'compute-mst': {
            const p = payload as { nodeIds: number[]; edges: GraphEdge[] }
            return {mst: kruskalMst(p.nodeIds, p.edges)}
        }
        default:
            throw new Error(`Unknown command: ${task}`)
    }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
    const {id, task, payload} = event.data

    let response: WorkerResponse
    try {
        const result = run(task, payload)
        response = {id, ok: true, result}
    } catch (error) {
        response = {
            id,
            ok: false,
            error: error instanceof Error ? error.message : String(error),
        }
    }

    ;(self as unknown as { postMessage: (msg: WorkerResponse) => void }).postMessage(response)
}