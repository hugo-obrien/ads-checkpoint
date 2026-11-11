import { onBeforeUnmount, ref, type Ref } from 'vue'
import type { WorkerRequest, WorkerResponse } from '@/workers/workerMessages'

// Типы для типизированного API воркера. Каждая задача регистрируется здесь.
export interface ComputeApi {
  fibonacci(n: number): Promise<number>
  sort(values: number[]): Promise<number[]>
}

const computeApi: ComputeApi = {
  fibonacci: (n) => runWorker('fibonacci', { n }),
  sort: (values) => runWorker('sort', { values }),
}

// Отложенный промис с типизированным resolve/reject.
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
  return { promise, resolve, reject }
}

let counter = 0
const pending = new Map<number, Deferred<unknown>>()

let worker: Worker | null = null

function getWorker(): Worker {
  if (worker) return worker
  worker = new Worker(new URL('./compute.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const { id, ok, result, error } = event.data
    const entry = pending.get(id)
    if (!entry) return
    pending.delete(id)
    if (ok) entry.resolve(result)
    else entry.reject(new Error(error))
  }
  worker.onerror = (event) => {
    // Глобальная ошибка воркера; обработка отдельных сообщений происходит
    // в onmessage через reject. Здесь просто логируем.
    // eslint-disable-next-line no-console
    console.error('Worker error:', event)
  }
  return worker
}

function runWorker<TRequest, TResult>(task: string, payload: TRequest): Promise<TResult> {
  const d = deferred<TResult>()
  const id = ++counter
  pending.set(id, d as Deferred<unknown>)

  const message: WorkerRequest = { id, task, payload }
  getWorker().postMessage(message)

  return d.promise
}

/**
 * Единый интерфейс для запуска тяжёлых операций в отдельном потоке.
 * Возвращает "живые" ref, которые можно биндить в шаблоне.
 */
export function useWorker() {
  const isRunning: Ref<boolean> = ref(false)
  const error: Ref<string | null> = ref(null)

  onBeforeUnmount(() => {
    // Воркер разделяемый и создаётся лениво — не убиваем его,
    // но сбрасываем состояние именно этого экземпляра.
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