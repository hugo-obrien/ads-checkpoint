<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import TaskLayout from '@/components/TaskLayout.vue'
import HashTableViewer from '@/components/HashTableViewer.vue'
import type {CollisionMethod, Equipment, HashStats} from '@core/algorithms/types'
import {
    buildTable,
    findChaining,
    findOpenAddressing,
    hash1,
    hash2,
} from '@core/algorithms/hash'
import {useWorker} from '@/composables/useWorker'

const items = ref<Equipment[]>([])
const baseCapacity = ref(11)
const capacity = ref(11)
const method = ref<CollisionMethod>('chaining')

const formId = ref<number | null>(null)
const formName = ref('')
const formRoom = ref('')
const formStatus = ref('')

const searchId = ref<number | null>(null)
const searchResult = ref<Equipment | null>(null)
const searchComparisons = ref<number | null>(null)
const searched = ref(false)

const workerBusy = ref(false)
const workerStatus = ref('')
const workerError = ref<string | null>(null)

const pageSize = 5
const currentPage = ref(1)

const {api} = useWorker()

const table = computed(() => buildTable(items.value, capacity.value, method.value))

const stats = computed<HashStats>(() => table.value.stats)

const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize)))
const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    return items.value.slice(start, start + pageSize)
})

watch(totalPages, (t) => {
    if (currentPage.value > t) currentPage.value = t
})

function goToPage(page: number): void {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
}

const GROW_THRESHOLD = 0.75
const GROW_AT = 1
const SHRINK_BELOW = 0.25

const showGrowWarning = computed(
    () => stats.value.loadFactor > GROW_THRESHOLD && stats.value.loadFactor < GROW_AT,
)

watch(stats, (s) => {
    if (s.loadFactor >= GROW_AT) {
        growTable()
    } else if (capacity.value > baseCapacity.value && s.loadFactor < SHRINK_BELOW) {
        shrinkTable()
    }
})

function growTable(): void {
    capacity.value = capacity.value * 2
    currentPage.value = 1
    workerError.value = null
}

function shrinkTable(): void {
    const newCap = Math.max(Math.floor(capacity.value / 2), baseCapacity.value)
    if (newCap === capacity.value) return
    capacity.value = newCap
    currentPage.value = 1
    workerError.value = null
}

function onSizeInput(): void {
    const v = Number(capacity.value)
    if (!Number.isFinite(v) || v < 1) return
    baseCapacity.value = v
    currentPage.value = 1
    workerError.value = null
}

const methodLabel = computed(() => {
    switch (method.value) {
        case 'chaining':
            return 'метод цепочек (закрытая адресация)'
        case 'linear':
            return 'линейное пробирование (открытая адресация)'
        case 'quadratic':
            return 'квадратичное пробирование (открытая адресация)'
        case 'double':
            return 'двойное хеширование (открытая адресация)'
    }
})

function addItem(): void {
    const name = formName.value.trim()
    if (!name) {
        workerError.value = 'Введите наименование оборудования.'
        return
    }
    const id = formId.value
    if (id === null || !Number.isInteger(id) || id < 1) {
        workerError.value = 'Укажите корректный инвентарный номер (целое ≥ 1).'
        return
    }
    if (items.value.some((e) => e.id === id)) {
        workerError.value = `Оборудование с инвентарным номером ${id} уже существует.`
        return
    }
    items.value.push({
        id,
        name,
        room: formRoom.value.trim(),
        status: formStatus.value.trim(),
    })
    formId.value = null
    formName.value = ''
    formRoom.value = ''
    formStatus.value = ''
    workerError.value = null
}

function removeItem(id: number): void {
    items.value = items.value.filter((e) => e.id !== id)
    if (searchResult.value?.id === id) {
        searchResult.value = null
        searchComparisons.value = null
        searched.value = false
    }
}

function doSearch(): void {
    searched.value = true
    const {buckets, slots} = table.value
    if (method.value === 'chaining') {
        const r = findChaining(buckets, searchId.value!)
        searchResult.value = r.item
        searchComparisons.value = r.comparisons
    } else {
        const r = findOpenAddressing(slots, searchId.value!, method.value)
        searchResult.value = r.item
        searchComparisons.value = r.comparisons
    }
}

function clearAll(): void {
    items.value = []
    searchResult.value = null
    searchComparisons.value = null
    searched.value = false
    workerError.value = null
}

function loadPreset(): void {
    const sample: Equipment[] = [
        {id: 1, name: 'Проектор BenQ', room: '301', status: 'рабочее'},
        {id: 12, name: 'Ноутбук HP', room: '108', status: 'рабочее'},
        {id: 23, name: 'Осциллограф', room: '202', status: 'в ремонте'},
        {id: 34, name: 'МФУ Kyocera', room: '305', status: 'рабочее'},
        {id: 45, name: 'Интерактивная доска', room: '108', status: 'рабочее'},
        {id: 56, name: 'Принтер', room: '204', status: 'списано'},
        {id: 67, name: 'Микроскоп', room: '210', status: 'рабочее'},
    ]
    items.value = sample
    clearSearch()
}

function clearSearch(): void {
    searchResult.value = null
    searchComparisons.value = null
    searched.value = false
    workerError.value = null
}

async function runWorkerBuild(): Promise<void> {
    workerBusy.value = true
    workerStatus.value = ''
    workerError.value = null
    try {
        const {stats: s} = await api.buildHashTable(
        items.value.map((e) => ({...e})),
        capacity.value,
        method.value,
    )
        workerStatus.value =
            `Хеш-таблица собрана в воркере (${methodLabel.value}): ` +
            `size=${s.size}, collisions=${s.collisions}, comparisons=${s.comparisons}`
    } catch (e) {
        workerError.value = e instanceof Error ? e.message : String(e)
    } finally {
        workerBusy.value = false
    }
}

const demoHashes = computed(() => {
    const id = searchId.value
    if (id === null) return null
    return {h1: hash1(id, capacity.value), h2: hash2(id, capacity.value)}
})

const methodOptions: Array<{value: CollisionMethod; label: string}> = [
    {value: 'chaining', label: 'метод цепочек'},
    {value: 'linear', label: 'линейное пробирование'},
    {value: 'quadratic', label: 'квадратичное пробирование'},
    {value: 'double', label: 'двойное хеширование'},
]
</script>

<template>
  <TaskLayout>
    <section class="controls">
      <div class="row">
        <label>
          Размер таблицы
          <input v-model.number="capacity" type="number" min="5" max="1010" @change="onSizeInput" />
        </label>
        <div v-if="showGrowWarning" class="grow-warning">
          ⚠ Коэффициент заполнения &gt; 0.75 — требуется расширение таблицы.
        </div>
        <label>
          Метод разрешения коллизий
          <select v-model="method">
            <option v-for="o in methodOptions" :key="o.value" :value="o.value">
              {{ o.label }}
            </option>
          </select>
        </label>
        <span class="hint-inline">Алгоритм: {{ methodLabel }}</span>
      </div>

      <form class="add-form" novalidate @submit.prevent="addItem">
        <label>
          Инв. номер
          <input v-model.number="formId" type="number" min="1" placeholder="напр. 12" />
        </label>
        <label>
          Наименование
          <input v-model="formName" type="text" placeholder="Проектор BenQ" />
        </label>
        <label>
          Аудитория
          <input v-model="formRoom" type="text" placeholder="301" />
        </label>
        <label>
          Состояние
          <input v-model="formStatus" type="text" placeholder="рабочее" />
        </label>
        <button type="submit" class="btn btn-primary">Добавить</button>
        <button type="button" class="btn btn-secondary" @click="loadPreset">Preset</button>
        <button type="button" class="btn btn-danger" @click="clearAll">Очистить</button>
      </form>

      <p v-if="workerError" class="warn">{{ workerError }}</p>
    </section>

    <section class="panel">
      <h3>Хеш-таблица: {{ methodLabel }}</h3>
      <HashTableViewer
          :buckets="table.buckets"
          :slots="table.slots"
          :capacity="capacity"
          :method="method"
      />
      <div class="actions">
        <button class="btn btn-secondary" :disabled="workerBusy" @click="runWorkerBuild">
          Собрать таблицу в воркере
        </button>
        <span v-if="workerStatus" class="muted">{{ workerStatus }}</span>
      </div>
    </section>

    <div class="grid">
      <section class="panel">
        <h3>Поиск по инв. номеру</h3>
        <form class="search-form" @submit.prevent="doSearch">
          <input v-model.number="searchId" type="number" min="1" placeholder="инв. номер" />
          <button type="submit" class="btn btn-primary">Найти</button>
        </form>
        <div v-if="demoHashes" class="hash-calc">
          <code>hash1({{ searchId }}, {{ capacity }}) = {{ demoHashes.h1 }}</code>
          <code v-if="method === 'double'">hash2({{ searchId }}, {{ capacity }}) = {{ demoHashes.h2 }}</code>
        </div>
        <div v-if="searched" class="result">
          <template v-if="searchResult">
            <strong>Найдено:</strong>
            <span>#{{ searchResult.id }} «{{ searchResult.name }}» · {{ searchResult.room }} · {{ searchResult.status }}</span>
          </template>
          <p v-else class="muted">Запись не найдена.</p>
          <p v-if="searchComparisons !== null" class="muted">Сравнений ключей: {{ searchComparisons }}</p>
        </div>
      </section>

      <section class="panel">
        <h3>Записи ({{ items.length }})</h3>
        <ul class="item-list">
          <li v-for="e in paginatedItems" :key="e.id" class="item-row">
            <span class="item-badge">#{{ e.id }}</span>
            <span class="item-name">{{ e.name }}</span>
            <span class="item-meta">{{ e.room }}</span>
            <span class="item-meta">{{ e.status }}</span>
            <button class="btn btn-danger" @click="removeItem(e.id)">Удалить</button>
          </li>
        </ul>
        <p v-if="!items.length" class="muted">Записей пока нет.</p>

        <div v-if="totalPages > 1" class="pagination">
          <button class="page-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">‹</button>
          <button
              v-for="p in totalPages"
              :key="p"
              class="page-btn"
              :class="{ active: p === currentPage }"
              @click="goToPage(p)"
          >
            {{ p }}
          </button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">›</button>
          <span class="page-info">Стр. {{ currentPage }} из {{ totalPages }}</span>
        </div>
      </section>
    </div>

    <section class="panel">
      <h3>Статистика</h3>
      <ul class="stats-list">
        <li>Записей (size): <strong>{{ stats.size }}</strong></li>
        <li>Размер таблицы: <strong>{{ stats.capacity }}</strong></li>
        <li>Коэффициент заполнения: <strong>{{ stats.loadFactor.toFixed(3) }}</strong></li>
        <li>Коллизий: <strong>{{ stats.collisions }}</strong></li>
        <li>Сравнений при вставке: <strong>{{ stats.comparisons }}</strong></li>
        <li v-if="method === 'chaining'">
          Макс. длина цепочки: <strong>{{ stats.maxChain }}</strong>
        </li>
        <li v-if="method === 'chaining'">
          Средняя длина цепочки: <strong>{{ stats.avgChain.toFixed(2) }}</strong>
        </li>
      </ul>
    </section>

    <section class="panel">
      <h3>Анализ сложности</h3>
      <table class="complexity">
        <thead>
        <tr><th>Операция</th><th>Среднее</th><th>Худший</th><th>Память</th></tr>
        </thead>
        <tbody>
        <tr><td>Хеш-функция</td><td>O(1)</td><td>O(1)</td><td>O(1)</td></tr>
        <tr><td>Поиск (метод цепочек)</td><td>O(1 + α)</td><td>O(n)</td><td>O(n)</td></tr>
        <tr><td>Поиск (линейное пробирование)</td><td>O(1)</td><td>O(n)</td><td>O(n)</td></tr>
        <tr><td>Поиск (квадратичное)</td><td>O(1)</td><td>O(n)</td><td>O(n)</td></tr>
        <tr><td>Поиск (двойное)</td><td>O(1)</td><td>O(n)</td><td>O(n)</td></tr>
        <tr><td>Вставка</td><td>O(1)</td><td>O(n)</td><td>O(n)</td></tr>
        <tr><td>Удаление</td><td>O(1)</td><td>O(n)</td><td>O(n)</td></tr>
        </tbody>
      </table>
      <p class="hint">α — коэффициент заполнения (n / m).</p>
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

.row input,
.row select {
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #fff;
}

.hint-inline {
  align-self: center;
  color: var(--color-text-muted);
  font-size: 0.85rem;
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

.hash-calc {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.6rem;
}

.hash-calc code {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.2rem 0.4rem;
  font-size: 0.8rem;
}

.result {
  margin-top: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.muted {
  color: var(--color-text-muted);
  font-size: 0.85rem;
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

.grow-warning {
  align-self: end;
  padding: 0.4rem 0.7rem;
  border-radius: var(--radius-sm);
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent);
  color: var(--color-accent-dark);
  font-size: 0.8rem;
  font-weight: 600;
}

.item-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.item-badge {
  font-weight: 700;
  color: var(--color-primary);
  min-width: 2.6rem;
}

.item-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  color: var(--color-text-muted);
  font-size: 0.85rem;
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

.actions {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-top: 1rem;
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

.hint {
  margin-top: 0.75rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}
</style>