import {onBeforeUnmount, ref, type Ref} from 'vue'
import type {WorkerRequest, WorkerResponse} from '@core/workers/workerMessages'
import type {CollisionMethod, Equipment, HashStats} from '@core/algorithms/types'

export interface ComputeApi {
    buildHeap(priorities: number[]): Promise<number[]>

    heapSort(priorities: number[]): Promise<number[]>

    buildHashTable(
        items: Equipment[],
        capacity: number,
        method: CollisionMethod,
    ): Promise<{stats: HashStats}>
}

const computeApi: ComputeApi = {
    buildHeap: (priorities) => runWorker('build-heap', {priorities}),
    heapSort: (priorities) => runWorker('heap-sort', {priorities}),
    buildHashTable: (items, capacity, method) =>
        runWorker('build-hash-table', {items, capacity, method}),
}

interface Deferred<T> {
    promise: Promise<T>
    resolve: (value: T) => void
    reject: (error: Error) => void
}

function deferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void
    let reject!: (error: Error) => void
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    return {promise, resolve, reject}
}

let counter = 0
const pending = new Map<number, Deferred<unknown>>()

let worker: Worker | null = null

function getWorker(): Worker {
    if (worker) return worker
    worker = new Worker(new URL('../../src/workers/compute.worker.ts', import.meta.url), {type: 'module'})
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const {id, ok, result, error} = event.data
        const entry = pending.get(id)
        if (!entry) return
        pending.delete(id)
        if (ok) entry.resolve(result)
        else entry.reject(new Error(error))
    }
    worker.onerror = (event) => {
        console.error('Worker error:', event)
    }
    return worker
}

function runWorker<TRequest, TResult>(task: string, payload: TRequest): Promise<TResult> {
    const d = deferred<TResult>()
    const id = ++counter
    pending.set(id, d as Deferred<unknown>)

    const message: WorkerRequest = {id, task, payload}
    getWorker().postMessage(message)

    return d.promise
}

/**
 * Run heavy tasks in separate thread
 */
export function useWorker() {
    const isRunning: Ref<boolean> = ref(false)
    const error: Ref<string | null> = ref(null)

    onBeforeUnmount(() => {
        isRunning.value = false
        error.value = null
    })

    async function run<TRequest, TResult>(task: string, payload: TRequest): Promise<TResult> {
        isRunning.value = true
        error.value = null
        try {
            return await runWorker<TRequest, TResult>(task, payload)
        } catch (e) {
            error.value = e instanceof Error ? e.message : String(e)
            throw e
        } finally {
            isRunning.value = false
        }
    }

    return {
        isRunning,
        error,
        run,
        api: computeApi,
    }
}