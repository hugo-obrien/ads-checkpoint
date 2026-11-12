<script setup lang="ts">
import type {ChainBucket, CollisionMethod, OpenSlot} from '@core/algorithms/types'

const props = defineProps<{
  buckets: ChainBucket[]
  slots: OpenSlot[]
  capacity: number
  method: CollisionMethod
}>()

const isChaining = () => props.method === 'chaining'

function slotClass(s: OpenSlot): Record<string, boolean> {
  return {
    'is-occupied': s.occupied,
    'is-deleted': !s.occupied && s.deleted,
    'is-empty': !s.occupied && !s.deleted,
  }
}
</script>

<template>
  <div class="hash-view">
    <div v-if="isChaining()" class="chaining">
      <div v-for="b in buckets" :key="b.bucket" class="chain-row">
        <span class="bucket-idx">[{{ b.bucket }}]</span>
        <div class="chain-items">
          <template v-for="item in b.items" :key="item.id">
            <span class="chain-item">
              <span class="item-id">{{ item.id }}</span>
              <span class="item-meta">{{ item.name }}</span>
              <span class="item-meta">{{ item.room }}</span>
              <span class="item-meta">{{ item.status }}</span>
            </span>
            <span class="chain-arrow">&rarr;</span>
          </template>
          <span v-if="!b.items.length" class="empty-marker">—</span>
        </div>
      </div>
    </div>

    <div v-else class="open">
      <div v-for="s in slots" :key="s.index" class="slot" :class="slotClass(s)">
        <span class="slot-idx">{{ s.index }}</span>
        <template v-if="s.occupied && s.item">
          <span class="item-id">{{ s.item.id }}</span>
          <span class="item-meta">{{ s.item.name }}</span>
          <span class="item-meta">{{ s.item.room }}</span>
          <span class="item-meta">{{ s.item.status }}</span>
        </template>
        <template v-else-if="s.deleted">
          <span class="del-marker">удал.</span>
        </template>
        <template v-else>
          <span class="empty-marker">—</span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hash-view {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  overflow-x: auto;
}

.chaining {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.chain-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.bucket-idx {
  flex: 0 0 auto;
  min-width: 2.6rem;
  text-align: center;
  font-weight: 700;
  color: var(--color-primary);
}

.chain-items {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.chain-item {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.chain-arrow {
  color: var(--color-text-muted);
}

.empty-marker {
  color: var(--color-text-muted);
}

.open {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.slot {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 6.5rem;
  padding: 0.4rem 0.55rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.slot-idx {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.is-occupied {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.is-deleted {
  border-style: dashed;
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}

.item-id {
  font-weight: 700;
  color: var(--color-text);
}

.item-meta {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.del-marker {
  color: var(--color-accent-dark);
  font-size: 0.8rem;
  font-weight: 600;
}
</style>