<script setup lang="ts">
import {computed} from 'vue'

// Визуализация максимальной двоичной кучи: массив (индексы) + дерево.
// Куча хранится в массиве `heap` (приоритеты), корень — heap[0].

const props = defineProps<{
  heap: number[]
}>()

const H = 46
const V = 58
const R = 16
const PAD = 20
const GAP = 10

interface HeapNode {
  index: number
  value: number
  x: number
  y: number
}

interface HeapEdge {
  x1: number
  y1: number
  x2: number
  y2: number
}

/**
 * Раскладка кучи уровнями. Для кучи высоты h ширина уровня h = 2^h узлов,
 * поэтому x-координата узла i вычисляется по его уровню и позиции в уровне.
 */
const layout = computed<{ nodes: HeapNode[]; edges: HeapEdge[] }>(() => {
  const nodes: HeapNode[] = []
  const edges: HeapEdge[] = []
  const levels: HeapNode[][] = []

  if (props.heap.length) {
    let level = 0
    let countInLevel = 1
    let idx = 0
    while (idx < props.heap.length) {
      const levelNodes: HeapNode[] = []
      for (let k = 0; k < countInLevel && idx < props.heap.length; k++, idx++) {
        const value = props.heap[idx]!
        // Ширина текущего уровня в "клетках" = 2^level.
        const width = 2 ** level
        const x = k + 0.5 // центр позиции k в пределах уровня
        const y = level
        levelNodes.push({index: idx, value, x, y})
      }
      levels.push(levelNodes)
      level++
      countInLevel *= 2
    }
  }

  // Расчёт фактических координат в пикселях: ширина уровня определяется
  // количеством листьев (последний уровень), чтобы всё центрировалось.
  const maxLevels = levels.length || 1
  const leafWidth = 2 ** (maxLevels - 1)

  for (const level of levels) {
    for (const n of level) {
      const levelWidth = 2 ** n.y
      const x = ((n.x / levelWidth) * leafWidth + 0.5) * H + PAD
      const y = n.y * V + V / 2 + PAD
      nodes.push({index: n.index, value: n.value, x, y})
    }
  }

  // Рёбра: индекс i -> 2i+1 и 2i+2.
  for (const n of nodes) {
    const left = 2 * n.index + 1
    const right = 2 * n.index + 2
    const li = props.heap.length > left ? nodes[left] : undefined
    const ri = props.heap.length > right ? nodes[right] : undefined
    if (li) edges.push({x1: n.x, y1: n.y, x2: li.x, y2: li.y})
    if (ri) edges.push({x1: n.x, y1: n.y, x2: ri.x, y2: ri.y})
  }

  return {nodes, edges}
})

const viewBox = computed(() => {
  const {nodes} = layout.value
  if (nodes.length === 0) return '0 0 220 80'
  const width = Math.max(...nodes.map((n) => n.x)) + H + PAD
  const height = Math.max(...nodes.map((n) => n.y)) + V / 2 + PAD
  return `0 0 ${width} ${height}`
})

// Массив с индексами для отображения "представление кучи массивом".
const arrayCells = computed(() => props.heap.map((v, i) => ({i, v})))
</script>

<template>
  <div class="heap-viewer">
    <div class="array-row">
      <div v-for="cell in arrayCells" :key="cell.i" class="array-cell">
        <span class="idx">{{ cell.i }}</span>
        <span class="val">{{ cell.v }}</span>
      </div>
      <p v-if="!arrayCells.length" class="empty-small">Куча пуста.</p>
    </div>

    <svg
        v-if="layout.nodes.length"
        :viewBox="viewBox"
        style="width: 100%; height: auto; min-width: 300px"
        role="img"
        aria-label="Схема максимальной двоичной кучи"
    >
      <line
          v-for="(e, i) in layout.edges"
          :key="'he' + i"
          :x1="e.x1"
          :y1="e.y1"
          :x2="e.x2"
          :y2="e.y2"
          stroke="#cfd9d5"
          stroke-width="2"
      />
      <g v-for="n in layout.nodes" :key="n.index">
        <circle
            :cx="n.x"
            :cy="n.y"
            :r="R"
            :fill="n.index === 0 ? '#009A63' : '#FF823D'"
        />
        <text
            :x="n.x"
            :y="n.y"
            text-anchor="middle"
            dominant-baseline="middle"
            fill="#FFFFFF"
            font-size="13"
            font-weight="700"
        >
          {{ n.value }}
        </text>
      </g>
    </svg>
    <p v-else class="empty">Куча пуста — добавьте заявки и постройте кучу.</p>
  </div>
</template>

<style scoped>
.heap-viewer {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  overflow: auto;
}

.array-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 1rem;
}

.array-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 2.2rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.array-cell .idx {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.array-cell .val {
  font-weight: 700;
  color: var(--color-text);
}

.empty,
.empty-small {
  color: var(--color-text-muted);
  text-align: center;
}

.empty {
  padding: 2rem 0;
}
</style>