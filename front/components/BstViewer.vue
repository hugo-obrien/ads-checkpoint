<script setup lang="ts">
import {computed} from 'vue'
import type {BstNode} from '@core/algorithms/types'

const props = defineProps<{
  root: BstNode | null
}>()

// Красивая раскладка для BST: горизонталь = in-order индекс (отсортированные
// колонки по id), вертикаль = глубина узла. Координаты в "клетках",
// масштабируются в SVG.

const H = 52 // шаг по горизонтали
const V = 64 // шаг по вертикали
const R = 18 // радиус узла
const PAD = 24

interface NodePos {
  ticket: BstNode['ticket']
  x: number
  y: number
}

const layout = computed(() => {
  const nodes: NodePos[] = []
  const edges: Array<{ p1: NodePos; p2: NodePos }> = []
  const posById = new Map<number, NodePos>()
  let idx = 0

  // Первый проход: размещаем узлы по in-order индексу (x) и глубине (y).
  function place(node: BstNode | null, depth: number): void {
    if (node === null) return
    place(node.left, depth + 1)
    const pos: NodePos = {ticket: node.ticket, x: idx, y: depth}
    idx++
    nodes.push(pos)
    posById.set(node.ticket.id, pos)
    place(node.right, depth + 1)
  }

  place(props.root, 0)

  // Второй проход: соединяем родителя с детьми.
  function link(node: BstNode | null, parent: NodePos | null): void {
    if (node === null) return
    const self = posById.get(node.ticket.id)!
    if (parent) edges.push({p1: parent, p2: self})
    link(node.left, self)
    link(node.right, self)
  }

  link(props.root, null)

  return {nodes, edges}
})

const maxX = computed(() =>
    layout.value.nodes.length ? Math.max(...layout.value.nodes.map((n) => n.x)) : 0,
)
const maxY = computed(() =>
    layout.value.nodes.length ? Math.max(...layout.value.nodes.map((n) => n.y)) : 0,
)

const viewBox = computed(() => {
  if (layout.value.nodes.length === 0) return '0 0 200 80'
  const width = (maxX.value + 1) * H + PAD * 2
  const height = (maxY.value + 1) * V + PAD * 2
  return `0 0 ${width} ${height}`
})

function cx(node: NodePos): number {
  return node.x * H + H / 2 + PAD
}

function cy(node: NodePos): number {
  return node.y * V + V / 2 + PAD
}
</script>

<template>
  <div class="bst-viewer">
    <svg
        v-if="layout.nodes.length"
        :viewBox="viewBox"
        style="width: 100%; height: auto; min-width: 320px"
        role="img"
        aria-label="Схема бинарного дерева поиска"
    >
      <line
          v-for="(e, i) in layout.edges"
          :key="'e' + i"
          :x1="cx(e.p1)"
          :y1="cy(e.p1)"
          :x2="cx(e.p2)"
          :y2="cy(e.p2)"
          stroke="#cfd9d5"
          stroke-width="2"
      />
      <g v-for="n in layout.nodes" :key="n.ticket.id">
        <circle
            :cx="cx(n)"
            :cy="cy(n)"
            :r="R"
            :fill="n.ticket.priority >= 5 ? '#FF823D' : '#009A63'"
        />
        <text
            :x="cx(n)"
            :y="cy(n) + 1"
            text-anchor="middle"
            dominant-baseline="middle"
            fill="#FFFFFF"
            font-size="13"
            font-weight="700"
        >
          {{ n.ticket.id }}
        </text>
        <text :x="cx(n)" :y="cy(n) + 15" text-anchor="middle" fill="#FFFFFF" font-size="9">
          p={{ n.ticket.priority }}
        </text>
      </g>
    </svg>
    <p v-else class="empty">Дерево пусто — добавьте первую заявку.</p>
  </div>
</template>

<style scoped>
.bst-viewer {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  overflow: auto;
}

.empty {
  color: var(--color-text-muted);
  text-align: center;
  padding: 2rem 0;
}
</style>