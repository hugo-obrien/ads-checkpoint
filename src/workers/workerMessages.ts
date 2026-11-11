// Протокол сообщений между основным потоком и Web Worker.
// Тяжёлые вычисления выполняются в воркере, чтобы не блокировать UI.

export interface WorkerRequest<T = unknown> {
  /** Уникальный id запроса, чтобы сопоставить ответ с промисом. */
  id: number
  /** Имя тяжёлой операции. */
  task: string
  payload: T
}

export interface WorkerResponse<T = unknown> {
  id: number
  ok: boolean
  result?: T
  error?: string
}

export interface FibonacciPayload {
  n: number
}

export interface SortPayload {
  values: number[]
}