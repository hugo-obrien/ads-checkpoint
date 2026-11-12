import type {ChainBucket, CollisionMethod, Equipment, HashStats, OpenSlot,} from './types'

export function hash1(id: number, capacity: number): number {
    return ((id % capacity) + capacity) % capacity
}

function gcd(a: number, b: number): number {
    while (b !== 0) {
        const t = a % b
        a = b
        b = t
    }
    return a
}

export function hash2(id: number, capacity: number): number {
    if (capacity < 2) return 1
    let step = 1 + (((id % (capacity - 1)) + (capacity - 1)) % (capacity - 1))
    while (gcd(step, capacity) !== 1) {
        step = step % capacity + 1
    }
    return step
}

function hashStep(id: number, capacity: number, probe: number, method: CollisionMethod): number {
    switch (method) {
        case 'linear':
            return (hash1(id, capacity) + probe) % capacity
        case 'quadratic':
            return (hash1(id, capacity) + probe * probe) % capacity
        case 'double': {
            const h1 = hash1(id, capacity)
            const h2 = hash2(id, capacity)
            return (h1 + probe * h2) % capacity
        }
        case 'chaining':
            return hash1(id, capacity)
    }
}

export function buildChaining(items: Equipment[], capacity: number): {
    buckets: ChainBucket[]
    stats: HashStats
} {
    const buckets: ChainBucket[] = Array.from({length: capacity}, (_, bucket) => ({
        bucket,
        items: [],
        comparisons: 0,
    }))

    let collisions = 0
    let comparisons = 0

    for (const item of items) {
        const idx = hash1(item.id, capacity)
        const bucket = buckets[idx]!

        if (bucket.items.length > 0) collisions += bucket.items.length

        let cmp = 0
        const existing = bucket.items.find((e) => {
            cmp++
            return e.id === item.id
        })
        comparisons += cmp
        if (existing) continue
        bucket.items.push(item)
        bucket.comparisons += cmp
    }

    const maxChain = buckets.reduce((m, b) => Math.max(m, b.items.length), 0)
    const nonEmpty = buckets.filter((b) => b.items.length > 0)
    const avgChain = nonEmpty.length
        ? nonEmpty.reduce((s, b) => s + b.items.length, 0) / nonEmpty.length
        : 0

    const size = sizeOf(buckets)
    const stats: HashStats = {
        size,
        capacity,
        loadFactor: capacity ? size / capacity : 0,
        collisions,
        comparisons,
        maxChain,
        avgChain,
    }
    return {buckets, stats}
}

function sizeOf(buckets: ChainBucket[]): number {
    return buckets.reduce((s, b) => s + b.items.length, 0)
}

export function buildOpenAddressing(items: Equipment[], capacity: number, method: CollisionMethod): {
    slots: OpenSlot[]
    stats: HashStats
} {
    const slots: OpenSlot[] = Array.from({length: capacity}, (_, index) => ({
        index,
        occupied: false,
        deleted: false,
        item: null,
    }))

    let collisions = 0
    let comparisons = 0

    for (const item of items) {
        let probe = 0
        let placed = false
        while (probe < capacity) {
            const idx = hashStep(item.id, capacity, probe, method)
            const slot = slots[idx]!

            if (!slot.occupied) {
                slots[idx] = {...slot, occupied: true, deleted: false, item}
                comparisons += probe + 1
                placed = true
                break
            }

            collisions++
            probe++
        }
        if (!placed) {

            comparisons += probe
        }
    }

    const size = slots.filter((s) => s.occupied).length
    const stats: HashStats = {
        size,
        capacity,
        loadFactor: capacity ? size / capacity : 0,
        collisions,
        comparisons,
        maxChain: 0,
        avgChain: 0,
    }
    return {slots, stats}
}

export function findChaining(buckets: ChainBucket[], id: number): { item: Equipment | null; comparisons: number } {
    const idx = hash1(id, buckets.length)
    const bucket = buckets[idx]!
    let cmp = 0
    for (const e of bucket.items) {
        cmp++
        if (e.id === id) return {item: e, comparisons: cmp}
    }
    return {item: null, comparisons: cmp}
}

export function findOpenAddressing(
    slots: OpenSlot[],
    id: number,
    method: CollisionMethod,
): { item: Equipment | null; comparisons: number } {
    let probe = 0
    let comparisons = 0
    while (probe < slots.length) {
        const idx = hashStep(id, slots.length, probe, method)
        const slot = slots[idx]!
        comparisons++
        if (!slot.occupied) {
            // Свободная позиция при пробировании означает, что ключа нет.
            return {item: null, comparisons}
        }
        if (!slot.deleted && slot.item && slot.item.id === id) {
            return {item: slot.item, comparisons}
        }
        probe++
    }
    return {item: null, comparisons}
}

export function removeChaining(buckets: ChainBucket[], id: number): ChainBucket[] {
    const idx = hash1(id, buckets.length)
    const bucket = buckets[idx]!
    return buckets.map((b, i) =>
        i === idx
            ? {...b, items: b.items.filter((e) => e.id !== id)}
            : b,
    )
}

export function removeOpenAddressing(
    slots: OpenSlot[],
    id: number,
    method: CollisionMethod,
): OpenSlot[] {
    const next = slots.map((s) => ({...s}))
    let probe = 0
    while (probe < next.length) {
        const idx = hashStep(id, next.length, probe, method)
        const slot = next[idx]!
        if (!slot.occupied) return next
        if (!slot.deleted && slot.item && slot.item.id === id) {
            next[idx] = {...slot, occupied: false, deleted: true, item: null}
            return next
        }
        probe++
    }
    return next
}

export function buildTable(
    items: Equipment[],
    capacity: number,
    method: CollisionMethod,
): { buckets: ChainBucket[]; slots: OpenSlot[]; stats: HashStats } {
    if (method === 'chaining') {
        const {buckets, stats} = buildChaining(items, capacity)
        return {buckets, slots: [], stats}
    }
    const {slots, stats} = buildOpenAddressing(items, capacity, method)
    return {buckets: [], slots, stats}
}