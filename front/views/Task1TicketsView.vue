<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import TaskLayout from '@/components/TaskLayout.vue'
import BstViewer from '@/components/BstViewer.vue'
import HeapViewer from '@/components/HeapViewer.vue'
import type {BstNode, Ticket} from '@core/algorithms/types'
import {computeTraversals, insert, search, stats, toArray} from '@core/algorithms/bst'
import {buildPriorityHeap, heapSortTickets, prioritiesOf} from '@core/algorithms/heap'
import {useWorker} from '@/composables/useWorker'

const tickets = ref<Ticket[]>([])

const formId = ref<number | null>(null)
const formTitle = ref('')
const formPriority = ref(1)

const pageSize = 5
const currentPage = ref(1)

const searchQuery = ref<number | null>(null)
const searchResult = ref<Ticket | null>(null)
const searched = ref(false)

const reportBusy = ref(false)
const reportStatus = ref('')
const reportError = ref<string | null>(null)

const {api} = useWorker()


const root = computed(() => {
  let r: BstNode | null = null
  for (const t of tickets.value) r = insert(r, t)
  return r
})

const treeStats = computed(() => stats(root.value))
const traversals = computed(() => computeTraversals(root.value))
const ticketList = computed(() => toArray(root.value))


const localHeap = computed(() => buildPriorityHeap(prioritiesOf(tickets.value)))

const totalPages = computed(() => Math.max(1, Math.ceil(ticketList.value.length / pageSize)))
const paginatedTickets = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return ticketList.value.slice(start, start + pageSize)
})

watch(totalPages, (t) => {
  if (currentPage.value > t) currentPage.value = t
})

function goToPage(page: number): void {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

function addTicket(): void {
  const title = formTitle.value.trim()
  if (!title) {
    reportError.value = 'Введите наименование заявки.'
    return
  }
  const id = formId.value
  if (id === null || !Number.isInteger(id) || id < 1) {
    reportError.value = 'Укажите корректный числовой id заявки (целое неотрицательное ≥ 1).'
    return
  }
  if (tickets.value.some((t) => t.id === id)) {
    reportError.value = `Заявка с id=${id} уже существует.`
    return
  }
  const priority = Math.max(0, Math.min(10, Math.floor(formPriority.value) || 0))
  tickets.value.push({id, title, priority})
  formId.value = null
  formTitle.value = ''
  formPriority.value = 1
  reportError.value = null
}

function removeTicket(id: number): void {
  tickets.value = tickets.value.filter((t) => t.id !== id)
  if (searchQuery.value !== null && searchResult.value?.id === id) {
    searchResult.value = null
    searched.value = false
  }
}

function doSearch(): void {
  searched.value = true
  searchResult.value = search(root.value, searchQuery.value!)
}

async function runWorkerOp(op: 'build-heap' | 'heap-sort'): Promise<void> {
  reportBusy.value = true
  reportStatus.value = ''
  reportError.value = null
  try {
    const priorities = prioritiesOf(tickets.value)
    if (op === 'build-heap') {
      const heap = await api.buildHeap(priorities)
      reportStatus.value = `Max-heap построена в воркере: [${heap.join(', ')}]`
    } else {
      const sorted = await api.heapSort(priorities)
      reportStatus.value = `Отсортировано (по убыванию приоритета): [${sorted.join(', ')}]`
    }
  } catch (e) {
    reportError.value = e instanceof Error ? e.message : String(e)
  } finally {
    reportBusy.value = false
  }
}

const report = computed(() => heapSortTickets(ticketList.value))
</script>

<template>
  <TaskLayout>
    <section class="controls">
      <form class="add-form" novalidate @submit.prevent="addTicket">
        <label>
          ID
          <input
              v-model.number="formId"
              type="number"
              min="1"
              required
              placeholder="напр. 42"
          />
        </label>
        <label>
          Наименование
          <input v-model="formTitle" type="text" placeholder="Описание заявки"/>
        </label>
        <label>
          Приоритет (0–10)
          <input v-model.number="formPriority" type="number" min="0" max="10" placeholder="1"/>
        </label>
        <button type="submit" class="btn btn-primary">Добавить</button>
      </form>

      <p v-if="reportError" class="warn">{{ reportError }}</p>
    </section>

    <div class="grid">

      <section class="panel">
        <h3>Бинарное дерево поиска (по id)</h3>
        <BstViewer :root="root"/>
      </section>

      <section class="panel">
        <h3>Поиск по id</h3>
        <form class="search-form" @submit.prevent="doSearch">
          <input v-model.number="searchQuery" type="number" min="1" placeholder="id заявки"/>
          <button type="submit" class="btn btn-primary">Найти</button>
        </form>
        <div v-if="searched" class="result">
          <template v-if="searchResult">
            <strong>Найдено:</strong>
            <span>#{{ searchResult.id }} «{{ searchResult.title }}» (приоритет {{ searchResult.priority }})</span>
          </template>
          <p v-else class="muted">Заявка не найдена.</p>
        </div>
      </section>
    </div>

    <section class="panel">
      <h3>Заявки ({{ ticketList.length }})</h3>
      <ul class="ticket-list">
        <li v-for="t in paginatedTickets" :key="t.id" class="ticket-item">
          <span class="ticket-badge">#{{ t.id }}</span>
          <span class="ticket-title">{{ t.title }}</span>
          <span class="ticket-prio">p={{ t.priority }}</span>
          <button class="btn btn-danger" @click="removeTicket(t.id)">Удалить</button>
        </li>
      </ul>
      <p v-if="!ticketList.length" class="muted">Заявок пока нет.</p>

      <div v-if="totalPages > 1" class="pagination">
        <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
        >
          ‹
        </button>
        <button
            v-for="p in totalPages"
            :key="p"
            class="page-btn"
            :class="{ active: p === currentPage }"
            @click="goToPage(p)"
        >
          {{ p }}
        </button>
        <button
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
        >
          ›
        </button>
        <span class="page-info">Стр. {{ currentPage }} из {{ totalPages }}</span>
      </div>
    </section>

    <section class="panel">
      <h3>Характеристики дерева</h3>
      <ul class="stats-list">
        <li>Узлов: <strong>{{ treeStats.nodeCount }}</strong></li>
        <li>Высота: <strong>{{ treeStats.height }}</strong></li>
        <li>Листьев: <strong>{{ treeStats.leaves }}</strong></li>
        <li>Внутренних узлов: <strong>{{ treeStats.internalNodes }}</strong></li>
        <li>
          Свойства БДП соблюдены:
          <strong :class="treeStats.isBst ? 'ok' : 'bad'">{{ treeStats.isBst ? 'да' : 'нет' }}</strong>
        </li>
      </ul>
    </section>

    <section class="panel">
      <h3>Обходы дерева</h3>
      <div class="traverse">
        <div class="tv"><span class="tv-label">Прямой</span><code>{{ traversals.preorder.join(', ') || '—' }}</code>
        </div>
        <div class="tv"><span class="tv-label">Симметричный</span><code>{{
            traversals.inorder.join(', ') || '—'
          }}</code></div>
        <div class="tv"><span class="tv-label">Обратный</span><code>{{ traversals.postorder.join(', ') || '—' }}</code>
        </div>
        <div class="tv"><span class="tv-label">Уровневый</span><code>{{
            traversals.levelOrder.join(', ') || '—'
          }}</code></div>
      </div>
    </section>

    <section class="panel">
      <h3>Двоичная куча (max-heap по приоритету)</h3>
      <p class="hint">Куча представлена массивом. Корень — наиболее срочная заявка.</p>
      <HeapViewer :heap="localHeap"/>
      <div class="actions">
        <button class="btn btn-secondary" :disabled="reportBusy" @click="runWorkerOp('build-heap')">
          Построить кучу в воркере
        </button>
        <span v-if="reportStatus" class="muted">{{ reportStatus }}</span>
      </div>
    </section>

    <section class="panel">
      <h3>Итоговый отчёт (сортировка кучей)</h3>
      <p class="hint">Заявки отсортированы по убыванию приоритета, при равенстве — по id.</p>
      <table class="report">
        <thead>
        <tr>
          <th>ID</th>
          <th>Название</th>
          <th>Приоритет</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="t in report" :key="t.id">
          <td>{{ t.id }}</td>
          <td>{{ t.title }}</td>
          <td class="prio">{{ t.priority }}</td>
        </tr>
        </tbody>
      </table>
      <div class="actions">
        <button class="btn btn-secondary" :disabled="reportBusy" @click="runWorkerOp('heap-sort')">
          Сортировать в воркере
        </button>
        <span v-if="reportStatus" class="muted">{{ reportStatus }}</span>
      </div>
    </section>

    <section class="panel">
      <h3>Анализ сложности</h3>
      <table class="complexity">
        <thead>
        <tr>
          <th>Операция</th>
          <th>Время (avg)</th>
          <th>Время (worst)</th>
          <th>Память</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <td>Вставка в БДП</td>
          <td>O(log n)</td>
          <td>O(n)</td>
          <td>O(h)</td>
        </tr>
        <tr>
          <td>Поиск в БДП</td>
          <td>O(log n)</td>
          <td>O(n)</td>
          <td>O(h)</td>
        </tr>
        <tr>
          <td>Удаление в БДП</td>
          <td>O(log n)</td>
          <td>O(n)</td>
          <td>O(h)</td>
        </tr>
        <tr>
          <td>Построение кучи</td>
          <td>O(n)</td>
          <td>O(n)</td>
          <td>O(n)</td>
        </tr>
        <tr>
          <td>Sift-up / sift-down</td>
          <td>O(log n)</td>
          <td>O(log n)</td>
          <td>O(1)</td>
        </tr>
        <tr>
          <td>Сортировка кучей</td>
          <td>O(n log n)</td>
          <td>O(n log n)</td>
          <td>O(1) доп.</td>
        </tr>
        </tbody>
      </table>
    </section>
  </TaskLayout>
</template>

<style scoped>
.controls {
  margin-bottom: 1.5rem;
}

.add-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
}

.add-form label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.add-form input {
  min-width: 8rem;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #fff;
}

.warn {
  margin-top: 0.75rem;
  color: var(--color-accent-dark);
  font-weight: 600;
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

.hint {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.btn {
  padding: 0.5rem 0.9rem;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.2s ease, transform 0.1s ease;
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

.search-form {
  display: flex;
  gap: 0.5rem;
}

.search-form input {
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.result {
  margin-top: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.ticket-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ticket-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.ticket-badge {
  font-weight: 700;
  color: var(--color-primary);
  min-width: 2.6rem;
}

.ticket-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ticket-prio {
  font-weight: 700;
  color: var(--color-accent-dark);
}

.btn-danger {
  background: var(--color-accent-soft);
  color: var(--color-accent-dark);
}

.btn-danger:hover {
  background: var(--color-accent);
  color: var(--color-text-invert);
}

.pagination {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.page-btn {
  min-width: 2rem;
  height: 2rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--color-text);
  cursor: pointer;
  font-weight: 600;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.page-btn:hover:not(:disabled):not(.active) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-invert);
}

.page-info {
  margin-left: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.muted {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.stats-list {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
}

.stats-list li {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.6rem 0.75rem;
}

.ok {
  color: var(--color-primary);
}

.bad {
  color: var(--color-accent-dark);
}

.traverse {
  display: grid;
  gap: 0.5rem;
}

.tv {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.tv-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 600;
}

.code,
code {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.9rem;
  word-break: break-all;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-top: 1rem;
}

.report,
.complexity {
  width: 100%;
  border-collapse: collapse;
}

.report th,
.report td,
.complexity th,
.complexity td {
  border: 1px solid var(--color-border);
  padding: 0.5rem 0.6rem;
  text-align: left;
  font-size: 0.9rem;
}

.report th,
.complexity th {
  background: var(--color-surface);
}

.prio {
  font-weight: 700;
  color: var(--color-accent-dark);
}
</style>