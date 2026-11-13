<script setup lang="ts">
import {computed, ref} from 'vue'
import TaskLayout from '@/components/TaskLayout.vue'
import GraphViewer from '@/components/GraphViewer.vue'
import type {GraphEdge, GraphNode, GraphStats, MstResult, PathResult} from '@core/algorithms/types'
import {bfs, buildAdjacency, dfs, graphStats} from '@core/algorithms/graph'
import {useWorker} from '@/composables/useWorker'

const nodes = ref<GraphNode[]>([])
const edges = ref<GraphEdge[]>([])

const formNodeId = ref<number | null>(null)
const formNodeLabel = ref('')

const formFrom = ref<number | null>(null)
const formTo = ref<number | null>(null)
const formWeight = ref<number | null>(null)

const traversalFrom = ref<number | null>(null)
const pathFrom = ref<number | null>(null)
const pathTo = ref<number | null>(null)

const workerBusy = ref(false)
const workerStatus = ref('')
const workerError = ref<string | null>(null)

const stats = ref<GraphStats | null>(null)
const mst = ref<MstResult | null>(null)
const shortest = ref<PathResult | null>(null)

const {api} = useWorker()

const adjacency = computed(() =>
    buildAdjacency(nodes.value.map((n) => n.id), edges.value),
)

const bfsOrder = computed<number[]>(() => {
    if (traversalFrom.value === null) return []
    return bfs(adjacency.value, traversalFrom.value).visitOrder
})

const dfsOrder = computed<number[]>(() => {
    if (traversalFrom.value === null) return []
    return dfs(adjacency.value, traversalFrom.value).visitOrder
})

const localStats = computed<GraphStats | null>(() => {
    if (nodes.value.length === 0) return null
    return graphStats(adjacency.value)
})

const nodeIdSet = computed(() => new Set(nodes.value.map((n) => n.id)))

const pathEdges = computed<Array<{ from: number; to: number }>>(() => {
    const path = shortest.value?.path ?? []
    const pairs: Array<{ from: number; to: number }> = []
    for (let i = 0; i < path.length - 1; i++) {
        pairs.push({from: path[i]!, to: path[i + 1]!})
    }
    return pairs
})

function existsEdge(from: number, to: number): boolean {
    return edges.value.some(
        (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
    )
}

function addNode(): void {
    const id = formNodeId.value
    const label = formNodeLabel.value.trim()
    if (id === null || !Number.isInteger(id) || id < 1) {
        workerError.value = 'Укажите корректный ID объекта (целое ≥ 1).'
        return
    }
    if (nodeIdSet.value.has(id)) {
        workerError.value = `Объект с ID ${id} уже существует.`
        return
    }
    nodes.value.push({id, label: label || `Объект ${id}`})
    formNodeId.value = null
    formNodeLabel.value = ''
    workerError.value = null
}

function removeNode(id: number): void {
    nodes.value = nodes.value.filter((n) => n.id !== id)
    edges.value = edges.value.filter((e) => e.from !== id && e.to !== id)
    workerError.value = null
}

function addEdge(): void {
    const from = formFrom.value
    const to = formTo.value
    const weight = formWeight.value
    if (from === null || to === null) {
        workerError.value = 'Выберите оба объекта для маршрута.'
        return
    }
    if (from === to) {
        workerError.value = 'Маршрут не может вести в тот же объект (петля).'
        return
    }
    if (!nodeIdSet.value.has(from) || !nodeIdSet.value.has(to)) {
        workerError.value = 'Оба объекта должны существовать.'
        return
    }
    if (existsEdge(from, to)) {
        workerError.value = 'Такой маршрут уже существует.'
        return
    }
    if (weight === null || !Number.isFinite(weight) || weight <= 0) {
        workerError.value = 'Длина маршрута должна быть положительным числом.'
        return
    }
    edges.value.push({from, to, weight})
    formFrom.value = null
    formTo.value = null
    formWeight.value = null
    workerError.value = null
}

function removeEdge(idx: number): void {
    edges.value = edges.value.filter((_, i) => i !== idx)
    workerError.value = null
}

function loadPreset(): void {
    const sampleNodes: GraphNode[] = [
        {id: 1, label: 'Корпус А'},
        {id: 2, label: 'Библиотека'},
        {id: 3, label: 'Столовая'},
        {id: 4, label: 'Спортзал'},
        {id: 5, label: 'Общежитие'},
    ]
    const sampleEdges: GraphEdge[] = [
        {from: 1, to: 2, weight: 120},
        {from: 1, to: 3, weight: 90},
        {from: 2, to: 4, weight: 180},
        {from: 3, to: 4, weight: 60},
        {from: 4, to: 5, weight: 150},
        {from: 3, to: 5, weight: 210},
    ]
    nodes.value = sampleNodes
    edges.value = sampleEdges
    traversalFrom.value = 1
    pathFrom.value = 1
    pathTo.value = 5
    workerError.value = null
}

function clearAll(): void {
    nodes.value = []
    edges.value = []
    stats.value = null
    mst.value = null
    shortest.value = null
    traversalFrom.value = null
    pathFrom.value = null
    pathTo.value = null
    workerError.value = null
    workerStatus.value = ''
}

async function analyse(): Promise<void> {
    if (nodes.value.length === 0) {
        workerError.value = 'Сначала добавьте объекты (узлы) и маршруты (рёбра).'
        return
    }
    if (pathFrom.value === null || pathTo.value === null) {
        workerError.value = 'Выберите источник и цель кратчайшего пути.'
        return
    }
    workerBusy.value = true
    workerStatus.value = ''
    workerError.value = null
    try {
        const result = await api.analyseGraph(
            nodes.value.map((n) => n.id),
            edges.value.map((e) => ({...e})),
            pathFrom.value,
            pathTo.value,
        )
        stats.value = result.stats
        mst.value = result.mst
        shortest.value = result.shortest
        workerStatus.value =
            `Анализ выполнен в воркере: компонент=${result.stats.components}, ` +
            `циклы=${result.stats.cycles ? 'есть' : 'нет'}, ` +
            `MST=${result.mst.edges.length} рёбер (${result.mst.totalWeight} м), ` +
            `путь ${pathFrom.value}→${pathTo.value} = ${result.shortest.path.join(' → ')} ` +
            `(${result.shortest.found ? `${result.shortest.distance} м` : 'не найден'})`
    } catch (e) {
        workerError.value = e instanceof Error ? e.message : String(e)
    } finally {
        workerBusy.value = false
    }
}

function formatTraversal(order: number[] | null): string {
    if (!order || order.length === 0) return '—'
    return order.join(' → ')
}

const nodeOptions = computed(() => nodes.value.map((n) => n.id))
</script>

<template>
  <TaskLayout>
    <section class="controls">
      <form class="add-form" novalidate @submit.prevent="addNode">
        <label>
          ID объекта
          <input v-model.number="formNodeId" type="number" min="1" placeholder="напр. 1" />
        </label>
        <label>
          Название
          <input v-model="formNodeLabel" type="text" placeholder="Корпус А" />
        </label>
        <button type="submit" class="btn btn-primary">Добавить объект</button>
        <button type="button" class="btn btn-secondary" @click="loadPreset">Preset</button>
        <button type="button" class="btn btn-danger" @click="clearAll">Очистить</button>
      </form>

      <form class="add-form" novalidate @submit.prevent="addEdge">
        <label>
          Откуда
          <select v-model.number="formFrom">
            <option :value="null" disabled>—</option>
            <option v-for="id in nodeOptions" :key="id" :value="id">{{ id }}</option>
          </select>
        </label>
        <label>
          Куда
          <select v-model.number="formTo">
            <option :value="null" disabled>—</option>
            <option v-for="id in nodeOptions" :key="id" :value="id">{{ id }}</option>
          </select>
        </label>
        <label>
          Длина (м)
          <input v-model.number="formWeight" type="number" min="1" placeholder="напр. 120" />
        </label>
        <button type="submit" class="btn btn-primary">Добавить маршрут</button>
      </form>

      <p v-if="workerError" class="warn">{{ workerError }}</p>
    </section>

    <section class="panel">
      <h3>Схема сети маршрутов</h3>
      <GraphViewer :nodes="nodes" :edges="edges" :in-mst="mst?.inMst" :path-edges="pathEdges" />
      <p class="hint">
        Зелёные рёбра — остовное дерево (Краскал), оранжевые — кратчайший путь от источника к цели.
      </p>
    </section>

    <div class="grid">
      <section class="panel">
        <h3>Статистика графа</h3>
        <ul v-if="stats || localStats" class="stats-list">
          <li>Объектов (узлов): <strong>{{ stats?.nodeCount ?? localStats?.nodeCount }}</strong></li>
          <li>Маршрутов (рёбер): <strong>{{ stats?.edgeCount ?? localStats?.edgeCount }}</strong></li>
          <li>Связных компонент: <strong>{{ stats?.components ?? localStats?.components }}</strong></li>
          <li>Есть циклы: <strong>{{ (stats?.cycles ?? localStats?.cycles) ? 'да' : 'нет' }}</strong></li>
          <li>Макс. степень: <strong>{{ stats?.maxDegree ?? localStats?.maxDegree }}</strong></li>
          <li>Средняя степень: <strong>{{ (stats?.avgDegree ?? localStats?.avgDegree)?.toFixed(2) }}</strong></li>
          <li>Граф связен: <strong>{{ (stats?.connected ?? localStats?.connected) ? 'да' : 'нет' }}</strong></li>
        </ul>
        <p v-else class="muted">Добавьте объекты и нажмите «Выполнить анализ».</p>
      </section>

      <section class="panel">
        <h3>Обходы графа</h3>
        <label class="inline">
          Стартовая вершина
          <select v-model.number="traversalFrom">
            <option :value="null" disabled>—</option>
            <option v-for="id in nodeOptions" :key="id" :value="id">{{ id }}</option>
          </select>
        </label>
        <div class="traversal">
          <p><strong>BFS:</strong> {{ formatTraversal(bfsOrder) }}</p>
          <p><strong>DFS:</strong> {{ formatTraversal(dfsOrder) }}</p>
        </div>
      </section>
    </div>

    <section class="panel">
      <h3>Анализ: минимальное остовное дерево и кратчайший путь</h3>
      <div class="row">
        <label>
          Источник
          <select v-model.number="pathFrom">
            <option :value="null" disabled>—</option>
            <option v-for="id in nodeOptions" :key="id" :value="id">{{ id }}</option>
          </select>
        </label>
        <label>
          Цель
          <select v-model.number="pathTo">
            <option :value="null" disabled>—</option>
            <option v-for="id in nodeOptions" :key="id" :value="id">{{ id }}</option>
          </select>
        </label>
        <button class="btn btn-primary" :disabled="workerBusy" @click="analyse">
          Выполнить анализ в воркере
        </button>
      </div>
      <p v-if="workerStatus" class="muted">{{ workerStatus }}</p>

      <div v-if="shortest" class="analysis">
        <div class="block">
          <h4>Кратчайший путь (Дейкстра)</h4>
          <p v-if="shortest.found">
            <code>{{ shortest.path.join(' → ') }}</code>
            <span class="muted"> · длина {{ shortest.distance }} м</span>
          </p>
          <p v-else class="muted">Путь от источника к цели не найден (разные компоненты).</p>
        </div>
        <div v-if="mst" class="block">
          <h4>Минимальное остовное дерево (Краскал)</h4>
          <ul class="mst-list">
            <li v-for="(e, i) in mst.edges" :key="i">
              {{ e.from }} – {{ e.to }} · {{ e.weight }} м
            </li>
          </ul>
          <p class="muted">Итоговый вес: {{ mst.totalWeight }} м</p>
        </div>
      </div>
    </section>

    <section class="panel">
      <h3>Анализ сложности</h3>
      <table class="complexity">
        <thead>
        <tr><th>Операция</th><th>Время</th><th>Память</th><th>Комментарий</th></tr>
        </thead>
        <tbody>
        <tr><td>Построение списка смежности</td><td>O(V + E)</td><td>O(V + E)</td><td>Из рёбер</td></tr>
        <tr><td>Обход BFS</td><td>O(V + E)</td><td>O(V)</td><td>Очередь</td></tr>
        <tr><td>Обход DFS</td><td>O(V + E)</td><td>O(V)</td><td>Стек/рекурсия</td></tr>
        <tr><td>Дейкстра</td><td>O(V²)</td><td>O(V)</td><td>Учебная реализация на массиве</td></tr>
        <tr><td>Краскал (MST)</td><td>O(E log E)</td><td>O(V)</td><td>Сортировка рёбер + DSU</td></tr>
        <tr><td>Проверка циклов</td><td>O(V + E)</td><td>O(V)</td><td>DFS с «родителем»</td></tr>
        <tr><td>Связность</td><td>O(V + E)</td><td>O(V)</td><td>Обход всех компонент</td></tr>
        </tbody>
      </table>
      <p class="hint">V — число объектов, E — число маршрутов.</p>
    </section>
  </TaskLayout>
</template>

<style scoped>
.controls {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.add-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
}

.add-form label,
.inline {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.add-form input,
.add-form select,
.inline select,
.row select {
  min-width: 7rem;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #fff;
}

.warn {
  color: var(--color-accent-dark);
  font-weight: 600;
  margin-top: 0.5rem;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 860px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.panel {
  margin-top: 1.5rem;
  padding: 1.25rem;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.panel h3 {
  margin-bottom: 0.9rem;
  color: var(--color-text);
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}

.row label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.btn {
  padding: 0.5rem 0.9rem;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.2s ease, background 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-text-invert);
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-secondary {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.btn-secondary:hover {
  background: var(--color-primary);
  color: var(--color-text-invert);
}

.btn-danger {
  background: var(--color-accent-soft);
  color: var(--color-accent-dark);
}

.btn-danger:hover {
  background: var(--color-accent);
  color: var(--color-text-invert);
}

.muted {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.hint {
  margin-top: 0.75rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.traversal {
  margin-top: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.traversal p {
  font-size: 0.9rem;
}

.stats-list {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.5rem;
}

.stats-list li {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.6rem 0.75rem;
}

.stats-list strong {
  color: var(--color-primary);
}

.analysis {
  margin-top: 1.2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
}

@media (max-width: 720px) {
  .analysis {
    grid-template-columns: 1fr;
  }
}

.block {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.9rem 1rem;
}

.block h4 {
  margin-bottom: 0.5rem;
  color: var(--color-text);
  font-size: 0.95rem;
}

.block code {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.2rem 0.4rem;
  font-size: 0.85rem;
}

.mst-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
}

.mst-list li {
  font-size: 0.88rem;
}

.complexity {
  width: 100%;
  border-collapse: collapse;
}

.complexity th,
.complexity td {
  border: 1px solid var(--color-border);
  padding: 0.5rem 0.6rem;
  text-align: left;
  font-size: 0.9rem;
}

.complexity th {
  background: var(--color-surface);
}
</style>