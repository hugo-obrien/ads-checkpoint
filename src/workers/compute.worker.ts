import type { WorkerRequest, WorkerResponse } from './workerMessages'

// Тяжёлые операции, выполняемые в отдельном потоке.
// Сюда добавляются задачи по мере продвижения по курсу.

function fibonacci(n: number): number {
  if (n < 0) throw new Error('n должно быть >= 0')
  let a = 0
  let b = 1
  for (let i = 0; i < n; i++) {
    const next = a + b
    a = b
    b = next
  }
  return a // fib(0)=0, fib(1)=1, fib(2)=1 ...
}

function sortNumbers(values: number[]): number[] {
  // Копия, чтобы не мутировать входные данные.
  return [...values].sort((a, b) => a - b)
}

function run<T>(task: string, payload: T): unknown {
  switch (task) {
    case 'fibonacci':
      return fibonacci((payload as { n: number }).n)
    case 'sort':
      return sortNumbers((payload as { values: number[] }).values)
    default:
      throw new Error(`Неизвестная операция: ${task}`)
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, task, payload } = event.data

  let response: WorkerResponse
  try {
    const result = run(task, payload)
    response = { id, ok: true, result }
  } catch (error) {
    response = {
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }

  ;(self as unknown as { postMessage: (msg: WorkerResponse) => void }).postMessage(response)
}