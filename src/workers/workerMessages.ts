export interface WorkerRequest<T = unknown> {
    id: number
    task: string
    payload: T
}

export interface WorkerResponse<T = unknown> {
    id: number
    ok: boolean
    result?: T
    error?: string
}

export interface SortPayload {
    values: number[]
}

export interface HeapPayload {
    priorities: number[]
}

export interface HashTablePayload {
    items: Array<{ id: number; name: string; room: string; status: string }>
    capacity: number
    method: 'chaining' | 'linear' | 'quadratic' | 'double'
}