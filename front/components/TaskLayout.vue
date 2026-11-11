<script setup lang="ts">
import {useRoute} from 'vue-router'
import {tasks} from '@/tasks/registry'

const route = useRoute()

// Рисуем заголовок страницы задачи из реестра, если это страница задачи.
const currentTask = tasks.find((t) => route.name === `task-${t.slug}`)
</script>

<template>
  <div class="task-page">
    <header class="task-hero">
      <nav class="breadcrumb">
        <RouterLink to="/" class="back-link">&larr; Все задачи</RouterLink>
      </nav>
      <h1 v-if="currentTask">{{ currentTask.title }}</h1>
      <p v-if="currentTask" class="task-desc">{{ currentTask.description }}</p>
    </header>

    <main class="task-body">
      <slot/>
    </main>
  </div>
</template>

<style scoped>
.task-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.task-hero {
  margin-bottom: 1.5rem;
}

.breadcrumb {
  margin-bottom: 1rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-sm);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 600;
  font-size: 0.9rem;
  transition: background 0.2s ease, color 0.2s ease;
}

.back-link:hover {
  background: var(--color-primary);
  color: var(--color-text-invert);
}

h1 {
  font-size: 2rem;
  line-height: 1.2;
  color: var(--color-text);
}

.task-desc {
  margin-top: 0.75rem;
  color: var(--color-text-muted);
  max-width: 60ch;
}

.task-body {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
}
</style>