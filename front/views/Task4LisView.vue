<script setup lang="ts">
import {computed, ref} from 'vue'
import TaskLayout from '@/components/TaskLayout.vue'
import LisViewer from '@/components/LisViewer.vue'
import type {LisResult} from '@core/algorithms/types'
import {useWorker} from '@/composables/useWorker'

const input = ref('10, 9, 2, 5, 3, 7, 101, 18')
const workerBusy = ref(false)
const workerError = ref<string | null>(null)
const workerStatus = ref('')

const optimal = ref<LisResult | null>(null)
const naive = ref<LisResult | null>(null)

const {api} = useWorker()

const values = computed<number[]>(() =>
    input.value
        .split(/[\s,;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number)
        .filter((n) => Number.isFinite(n)),
)

const parseError = computed<string | null>(() => {
    const raw = input.value.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean)
    const invalid = raw.filter((s) => !Number.isFinite(Number(s)))
    return invalid.length ? `Некорректные значения: ${invalid.join(', ')}` : null
})

function loadPreset(valuesPreset: number[]): void {
    input.value = valuesPreset.join(', ')
    optimal.value = null
    naive.value = null
    workerError.value = null
    workerStatus.value = ''
}

async function computeLis(): Promise<void> {
    if (parseError.value) {
        workerError.value = parseError.value
        return
    }
    if (values.value.length === 0) {
        workerError.value = 'Введите хотя бы одно число.'
        return
    }
    workerBusy.value = true
    workerStatus.value = ''
    workerError.value = null
    try {
        const result = await api.computeLis(values.value.map((v) => v))
        optimal.value = result.optimal
        naive.value = result.naive
        if (result.naive === null) {
            workerStatus.value =
                'Оптимальный алгоритм O(n log n) вычислен; наивный O(n²) пропущен на входе > 5000.'
        } else {
            workerStatus.value = 'Оба алгоритма вычислены в Web Worker: O(n²) и O(n log n).'
        }
    } catch (e) {
        workerError.value = e instanceof Error ? e.message : String(e)
    } finally {
        workerBusy.value = false
    }
}

const highlightIndices = computed<number[]>(() => optimal.value?.indices ?? [])

function formatSeq(seq: number[]): string {
    return seq.length ? seq.join(' → ') : '—'
}
</script>

<template>
  <TaskLayout>
    <section class="controls">
      <label class="full">
        Последовательность целых чисел (через запятую, пробел или точку с запятой)
        <textarea v-model="input" rows="3" spellcheck="false"></textarea>
      </label>

      <div class="row">
        <button class="btn btn-secondary" @click="loadPreset([10, 9, 2, 5, 3, 7, 101, 18])">
          Классический
        </button>
        <button class="btn btn-secondary" @click="loadPreset([1, 2, 3, 4, 5, 6])">
          Возрастающая
        </button>
        <button class="btn btn-secondary" @click="loadPreset([6, 5, 4, 3, 2, 1])">
          Убывающая
        </button>
        <button class="btn btn-secondary" @click="loadPreset([7, 7, 7, 1, 2, 3, 3])">
          С повторами
        </button>
        <button
            class="btn btn-secondary"
            @click="loadPreset(Array.from({length: 200}, (_, i) => Math.round(Math.sin(i / 2) * 100)))"
        >
          Длинная (200)
        </button>
      </div>

      <div class="row">
        <button class="btn btn-primary" :disabled="workerBusy" @click="computeLis">
          Вычислить
        </button>
        <span class="hint-inline">Чисел: {{ values.length }}</span>
      </div>

      <p v-if="parseError" class="warn">{{ parseError }}</p>
      <p v-if="workerError" class="warn">{{ workerError }}</p>
      <p v-if="workerStatus" class="muted">{{ workerStatus }}</p>
    </section>

    <section class="panel">
      <h3>Исходная последовательность и выбранная LIS</h3>
      <LisViewer :values="values" :highlight-indices="highlightIndices" />
      <p class="hint">Подсвечены элементы, вошедшие в найденную возрастающую подпоследовательность.</p>
    </section>

    <div class="grid">
      <section class="panel">
        <h3>Результат (оптимальный)</h3>
        <template v-if="optimal">
          <p><strong>Длина:</strong> {{ optimal.length }}</p>
          <p><strong>Подпоследовательность:</strong> <code>{{ formatSeq(optimal.seq) }}</code></p>
          <p class="muted">Индексы: {{ optimal.indices.join(', ') }}</p>
        </template>
        <p v-else class="muted">Нажмите «Оптимальный O(n log n)».</p>
      </section>

      <section class="panel">
        <h3>Результат (наивный)</h3>
        <template v-if="naive">
          <p><strong>Длина:</strong> {{ naive.length }}</p>
          <p><strong>Подпоследовательность:</strong> <code>{{ formatSeq(naive.seq) }}</code></p>
        </template>
        <p v-else class="muted">Нажмите «Наивный O(n²)».</p>
      </section>
    </div>

    <section class="panel">
      <h3>Сравнение алгоритмов</h3>
      <table class="cmp">
        <thead>
        <tr>
          <th>Алгоритм</th>
          <th>Время</th>
          <th>Память</th>
          <th>Сравнений (факт)</th>
          <th>Длина LIS</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <td>Наивный DP</td>
          <td>O(n²)</td>
          <td>O(n)</td>
          <td>{{ naive ? naive.comparisons : '—' }}</td>
          <td>{{ naive ? naive.length : '—' }}</td>
        </tr>
        <tr class="best">
          <td>«Хвосты» + бинарный поиск</td>
          <td>O(n log n)</td>
          <td>O(n)</td>
          <td>{{ optimal ? optimal.comparisons : '—' }}</td>
          <td>{{ optimal ? optimal.length : '—' }}</td>
        </tr>
        </tbody>
      </table>
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

.full {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

textarea {
  width: 100%;
  padding: 0.6rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #fff;
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.hint-inline {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.warn {
  color: var(--color-accent-dark);
  font-weight: 600;
}

.muted {
  color: var(--color-text-muted);
  font-size: 0.9rem;
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

.panel p {
  margin-bottom: 0.6rem;
  line-height: 1.6;
  font-size: 0.93rem;
}

code {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.1rem 0.35rem;
  font-size: 0.85rem;
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

.cmp {
  width: 100%;
  border-collapse: collapse;
}

.cmp th,
.cmp td {
  border: 1px solid var(--color-border);
  padding: 0.5rem 0.6rem;
  text-align: left;
  font-size: 0.9rem;
}

.cmp th {
  background: var(--color-surface);
}

.cmp tr.best td {
  background: var(--color-primary-soft);
  font-weight: 600;
  color: var(--color-primary);
}

.hint {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}
</style>