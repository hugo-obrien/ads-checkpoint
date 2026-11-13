<script setup lang="ts">
import {computed, onBeforeUnmount, reactive, ref, watch} from 'vue'
import type {GraphEdge, GraphNode} from '@core/algorithms/types'

const props = defineProps<{
  nodes: GraphNode[]
  edges: GraphEdge[]
  inMst?: Array<{ from: number; to: number }>
  pathEdges?: Array<{ from: number; to: number }>
}>()

const R = 24
const CENTER = 180
const RADIUS = 130
const SIZE = 360

const positions = reactive<Record<string, { x: number; y: number }>>({})

function circlePos(index: number, count: number): { x: number; y: number } {
  const angle = (2 * Math.PI * index) / Math.max(count, 1) - Math.PI / 2
  return {
    x: CENTER + RADIUS * Math.cos(angle),
    y: CENTER + RADIUS * Math.sin(angle),
  }
}

function syncPositions(): void {
  const count = props.nodes.length
  props.nodes.forEach((node, i) => {
    const key = String(node.id)
    if (!positions[key]) {
      positions[key] = circlePos(i, count)
    }
  })
}

watch(
    () => props.nodes.map((n) => n.id),
    syncPositions,
    {immediate: true},
)

const layoutPositions = computed(() => {
  const pos = new Map<number, { x: number; y: number }>()
  props.nodes.forEach((n) => {
    pos.set(n.id, positions[String(n.id)])
  })
  return pos
})

const svgRef = ref<SVGSVGElement | null>(null)
const draggingId = ref<number | null>(null)
const dragOffset = ref<{ x: number; y: number } | null>(null)

function toSvgPoint(ev: MouseEvent): { x: number; y: number } {
  const svg = svgRef.value
  if (!svg) return {x: CENTER, y: CENTER}
  const pt = svg.createSVGPoint()
  pt.x = ev.clientX
  pt.y = ev.clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return {x: CENTER, y: CENTER}
  const p = pt.matrixTransform(ctm.inverse())
  return {x: p.x, y: p.y}
}

function clampCoord(v: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, v))
}

function onNodePointerDown(id: number, ev: MouseEvent): void {
  if (ev.button !== 0) return
  ev.preventDefault()
  const target = layoutPositions.value.get(id)
  if (!target) return
  const p = toSvgPoint(ev)
  draggingId.value = id
  dragOffset.value = {x: p.x - target.x, y: p.y - target.y}
  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('mouseup', onWindowMouseUp)
}

function onWindowMouseMove(ev: MouseEvent): void {
  if (draggingId.value === null || dragOffset.value === null) return
  const p = toSvgPoint(ev)
  positions[String(draggingId.value)] = {
    x: clampCoord(p.x - dragOffset.value.x, R, SIZE - R),
    y: clampCoord(p.y - dragOffset.value.y, R, SIZE - R),
  }
}

function onWindowMouseUp(): void {
  draggingId.value = null
  dragOffset.value = null
  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('mouseup', onWindowMouseUp)
}

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('mouseup', onWindowMouseUp)
})

const isInMst = (e: GraphEdge): boolean =>
    !!props.inMst?.some((m) => (m.from === e.from && m.to === e.to) || (m.from === e.to && m.to === e.from))

const isOnPath = (e: GraphEdge): boolean =>
    !!props.pathEdges?.some((m) => (m.from === e.from && m.to === e.to) || (m.from === e.to && m.to === e.from))

function px(id: number): number {
  return layoutPositions.value.get(id)?.x ?? CENTER
}

function py(id: number): number {
  return layoutPositions.value.get(id)?.y ?? CENTER
}

function edgeMidX(e: GraphEdge): number {
  return (px(e.from) + px(e.to)) / 2
}

function edgeMidY(e: GraphEdge): number {
  return (py(e.from) + py(e.to)) / 2
}
</script>

<template>
  <div class="graph-view">
    <svg
        v-if="nodes.length"
        ref="svgRef"
        :viewBox="`0 0 ${SIZE} ${SIZE}`"
        style="width: 100%; max-width: 400px; height: auto"
        role="img"
        aria-label="Схема графа сети маршрутов"
    >

      <g v-for="(e, i) in edges" :key="'e' + i">
        <line
            :x1="px(e.from)"
            :y1="py(e.from)"
            :x2="px(e.to)"
            :y2="py(e.to)"
            :stroke="isOnPath(e) ? '#FF823D' : (isInMst(e) ? '#009A63' : '#cfd9d5')"
            :stroke-width="isOnPath(e) || isInMst(e) ? 3 : 2"
        />

        <text
            :x="edgeMidX(e)"
            :y="edgeMidY(e) - 6"
            text-anchor="middle"
            fill="#5c6b64"
            font-size="11"
        >
          {{ e.weight }}
        </text>
      </g>


      <g
          v-for="n in nodes"
          :key="n.id"
          class="node"
          :class="{ dragging: draggingId === n.id }"
          @mousedown="onNodePointerDown(n.id, $event)"
      >
        <circle :cx="px(n.id)" :cy="py(n.id)" :r="R" fill="#009A63"/>
        <text
            :x="px(n.id)"
            :y="py(n.id)"
            text-anchor="middle"
            dominant-baseline="middle"
            fill="#FFFFFF"
            font-size="12"
            font-weight="700"
        >
          {{ n.id }}
        </text>
        <text
            :x="px(n.id)"
            :y="py(n.id) + R + 12"
            text-anchor="middle"
            fill="#5c6b64"
            font-size="10"
        >
          {{ n.label }}
        </text>
      </g>
    </svg>
    <p v-else class="empty">Граф пуст — добавьте объекты (узлы) и маршруты (рёбра).</p>
  </div>
</template>

<style scoped>
.graph-view {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  justify-content: center;
}

svg {
  user-select: none;
  touch-action: none;
}

.node {
  cursor: grab;
}

.node.dragging {
  cursor: grabbing;
}

.empty {
  color: var(--color-text-muted);
  text-align: center;
  padding: 2rem 0;
}
</style>