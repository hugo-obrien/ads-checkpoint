import type {LisComparison, LisResult} from './types'

function lowerBound(tails: number[], len: number, x: number): number {
    let lo = 0
    let hi = len
    while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (tails[mid]! < x) lo = mid + 1
        else hi = mid
    }
    return lo
}

export function lisNaive(a: number[]): LisResult {
    const n = a.length
    const dp = new Array<number>(n).fill(1)
    const prev = new Array<number>(n).fill(-1)
    let comparisons = 0

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < i; j++) {
            comparisons++
            if (a[j]! < a[i]! && dp[j]! + 1 > dp[i]!) {
                dp[i] = dp[j]! + 1
                prev[i] = j
            }
        }
    }

    let best = 0
    for (let i = 1; i < n; i++) {
        if (dp[i]! > dp[best]!) best = i
    }

    const indices: number[] = []
    let cur = best
    while (cur !== -1) {
        indices.unshift(cur)
        cur = prev[cur]!
    }

    return {
        seq: indices.map((i) => a[i]!),
        indices,
        length: indices.length,
        comparisons,
    }
}

export function lisOptimal(a: number[]): LisResult {
    const n = a.length
    const tails = new Array<number>(n)
    const chainLen = new Array<number>(n)

    let len = 0
    let comparisons = 0

    for (let i = 0; i < n; i++) {
        const x = a[i]!
        const pos = lowerBound(tails, len, x)
        comparisons += Math.ceil(Math.log2(len + 1))
        chainLen[i] = pos + 1
        tails[pos] = x
        if (pos === len) len++
    }

    const indices: number[] = []
    let need = len
    let lastValue = Infinity
    for (let i = n - 1; i >= 0 && need > 0; i--) {
        if (chainLen[i]! === need && a[i]! < lastValue) {
            indices.unshift(i)
            need--
            lastValue = a[i]!
        }
    }

    return {
        seq: indices.map((i) => a[i]!),
        indices,
        length: indices.length,
        comparisons,
    }
}

export function computeLis(a: number[]): LisComparison {
    const naive = lisNaive(a)
    const optimal = lisOptimal(a)
    return {naive, optimal}
}