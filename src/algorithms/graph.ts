import type {
    AdjacencyList,
    DijkstraResult,
    GraphEdge,
    GraphStats,
    MstResult,
    PathResult,
} from './types'

export function buildAdjacency(nodes: number[], edges: GraphEdge[]): AdjacencyList {
    const adj = new Map<number, Array<{ to: number; weight: number }>>()
    for (const id of nodes) adj.set(id, [])
    for (const e of edges) {
        if (!adj.has(e.from)) adj.set(e.from, [])
        if (!adj.has(e.to)) adj.set(e.to, [])
        adj.get(e.from)!.push({ to: e.to, weight: e.weight })
        adj.get(e.to)!.push({ to: e.from, weight: e.weight })
    }
    return { nodes: adj }
}

export function degrees(adj: AdjacencyList): Map<number, number> {
    const deg = new Map<number, number>()
    for (const [id] of adj.nodes) deg.set(id, 0)
    for (const [, list] of adj.nodes) {
        for (const { to } of list) deg.set(to, (deg.get(to) ?? 0) + 1)
    }
    return deg
}

export function bfs(adj: AdjacencyList, source: number): PathResult {
    const visitOrder: number[] = []
    const visited = new Set<number>()
    const queue: number[] = [source]
    visited.add(source)
    while (queue.length) {
        const v = queue.shift()!
        visitOrder.push(v)
        const list = adj.nodes.get(v) ?? []
        // Сортируем соседей для детерминированного порядка вывода.
        for (const { to } of [...list].sort((a, b) => a.to - b.to)) {
            if (!visited.has(to)) {
                visited.add(to)
                queue.push(to)
            }
        }
    }
    return { path: visitOrder, distance: 0, visitOrder, found: visitOrder.length > 0 }
}

export function dfs(adj: AdjacencyList, source: number): PathResult {
    const visitOrder: number[] = []
    const visited = new Set<number>()
    function visit(v: number): void {
        if (visited.has(v)) return
        visited.add(v)
        visitOrder.push(v)
        const list = adj.nodes.get(v) ?? []
        for (const { to } of [...list].sort((a, b) => a.to - b.to)) {
            visit(to)
        }
    }
    visit(source)
    return { path: visitOrder, distance: 0, visitOrder, found: visitOrder.length > 0 }
}

export function dijkstra(adj: AdjacencyList, source: number): DijkstraResult {
    const dist = new Map<number, number>()
    const prev = new Map<number, number | null>()
    const visited = new Set<number>()
    for (const id of adj.nodes.keys()) {
        dist.set(id, Infinity)
        prev.set(id, null)
    }
    dist.set(source, 0)

    for (;;) {
        let u: number | null = null
        let best = Infinity
        for (const [id, d] of dist) {
            if (!visited.has(id) && d < best) {
                best = d
                u = id
            }
        }
        if (u === null || best === Infinity) break
        visited.add(u)
        for (const { to, weight } of adj.nodes.get(u) ?? []) {
            if (visited.has(to)) continue
            const nd = (dist.get(u) ?? Infinity) + weight
            if (nd < (dist.get(to) ?? Infinity)) {
                dist.set(to, nd)
                prev.set(to, u)
            }
        }
    }

    const distances: Record<number, number> = {}
    const previous: Record<number, number | null> = {}
    for (const [id, d] of dist) distances[id] = d === Infinity ? Infinity : d
    for (const [id, p] of prev) previous[id] = p
    return { source, distances, previous }
}

export function reconstructPath(prev: Record<number, number | null>, from: number, to: number): number[] {
    const path: number[] = []
    let cur: number | null = to
    while (cur !== null) {
        path.unshift(cur)
        if (cur === from) break
        cur = prev[cur] ?? null
    }
    if (path[0] !== from) return [] // путь не найден
    return path
}

export function connectedComponents(adj: AdjacencyList): number {
    const visited = new Set<number>()
    let components = 0
    for (const id of adj.nodes.keys()) {
        if (visited.has(id)) continue
        components++
        const queue = [id]
        visited.add(id)
        while (queue.length) {
            const v = queue.shift()!
            for (const { to } of adj.nodes.get(v) ?? []) {
                if (!visited.has(to)) {
                    visited.add(to)
                    queue.push(to)
                }
            }
        }
    }
    return components
}

export function hasCycle(adj: AdjacencyList): boolean {
    const visited = new Set<number>()
    function dfsCycle(v: number, parent: number): boolean {
        visited.add(v)
        for (const { to } of adj.nodes.get(v) ?? []) {
            if (!visited.has(to)) {
                if (dfsCycle(to, v)) return true
            } else if (to !== parent) {
                return true
            }
        }
        return false
    }
    for (const id of adj.nodes.keys()) {
        if (!visited.has(id)) {
            if (dfsCycle(id, -1)) return true
        }
    }
    return false
}

export function graphStats(adj: AdjacencyList): GraphStats {
    const deg = degrees(adj)
    const values = [...deg.values()]
    const maxDegree = values.length ? Math.max(...values) : 0
    const avgDegree = values.length
        ? values.reduce((s, d) => s + d, 0) / values.length
        : 0

    let edgeCount = 0
    for (const [, list] of adj.nodes) edgeCount += list.length
    edgeCount = Math.floor(edgeCount / 2) // неориентированные рёбра посчитаны дважды

    const components = connectedComponents(adj)
    return {
        nodeCount: adj.nodes.size,
        edgeCount,
        components,
        cycles: hasCycle(adj),
        maxDegree,
        avgDegree,
        connected: components === 1 && adj.nodes.size > 0,
    }
}

function sortEdges(edges: GraphEdge[]): GraphEdge[] {
    return [...edges].sort((a, b) => a.weight - b.weight)
}

class DSU {
    private parent: Map<number, number>
    constructor(ids: number[]) {
        this.parent = new Map()
        for (const id of ids) this.parent.set(id, id)
    }
    find(x: number): number {
        let r = x
        while (this.parent.get(r) !== r) r = this.parent.get(r)!
        // path compression
        this.parent.set(x, r)
        return r
    }
    union(a: number, b: number): boolean {
        const ra = this.find(a)
        const rb = this.find(b)
        if (ra === rb) return false
        this.parent.set(rb, ra)
        return true
    }
}

export function kruskalMst(nodeIds: number[], edges: GraphEdge[]): MstResult {
    const dsu = new DSU(nodeIds)
    const sorted = sortEdges(edges.map((e) => ({ ...e })))
    const mst: GraphEdge[] = []
    const inMst: Array<{ from: number; to: number }> = []
    let totalWeight = 0
    for (const e of sorted) {
        if (dsu.union(e.from, e.to)) {
            mst.push(e)
            totalWeight += e.weight
            inMst.push({ from: e.from, to: e.to })
        }
    }
    return { edges: mst, totalWeight, inMst }
}

export function shortestPath(adj: AdjacencyList, from: number, to: number): PathResult {
    const { distances, previous } = dijkstra(adj, from)
    const d = distances[to] ?? Infinity
    if (d === Infinity) {
        return { path: [], distance: Infinity, visitOrder: [], found: false }
    }
    const path = reconstructPath(previous, from, to)
    return { path, distance: d, visitOrder: path, found: true }
}

export function analyseGraph(
    nodeIds: number[],
    edges: GraphEdge[],
    source: number,
    target: number,
): {
    stats: GraphStats
    shortest: PathResult
    mst: MstResult
} {
    const adj = buildAdjacency(nodeIds, edges)
    const stats = graphStats(adj)
    const shortest = shortestPath(adj, source, target)
    const mst = kruskalMst(nodeIds, edges)
    return { stats, shortest, mst }
}