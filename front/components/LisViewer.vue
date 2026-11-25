<script setup lang="ts">

defineProps<{
  values: number[]
  highlightIndices?: number[]
}>()

const BAR_MAX = 28

function barHeight(v: number, all: number[]): number {
  const max = Math.max(...all.map(Math.abs), 1)
  return Math.max(6, Math.round((Math.abs(v) / max) * BAR_MAX))
}
</script>

<template>
  <div class="lis-view">
    <div v-if="values.length" class="cells">
      <div
          v-for="(v, i) in values"
          :key="i"
          class="cell"
          :class="{ picked: highlightIndices?.includes(i) }"
      >
        <span class="idx">{{ i }}</span>
        <span class="bar" :style="{ height: barHeight(v, values) + 'px' }"></span>
        <span class="val">{{ v }}</span>
      </div>
    </div>
    <p v-else class="empty">Последовательность пуста — введите числа.</p>
  </div>
</template>

<style scoped>
.lis-view {
  width: 100%;
  overflow-x: auto;
}

.cells {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  min-height: 100px;
  padding-bottom: 4px;
}

.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 2rem;
  padding: 4px 2px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.cell.picked {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
}

.cell.picked .val {
  color: var(--color-primary);
  font-weight: 700;
}

.idx {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.bar {
  width: 10px;
  background: #cfd9d5;
  border-radius: 3px;
}

.cell.picked .bar {
  background: var(--color-primary);
}

.val {
  font-size: 0.85rem;
  color: var(--color-text);
}

.empty {
  color: var(--color-text-muted);
  text-align: center;
  padding: 1.5rem 0;
}
</style>