<script setup lang="ts">
import { tasks } from '@/tasks/registry'
</script>

<template>
  <div class="home">
    <section class="hero">
      <span class="badge">Контрольное задание</span>
      <h1>Алгоритмы и структуры данных</h1>
      <p class="subtitle">
        Язык выполнения: TypeScript + Vue
      </p>
    </section>

    <section class="tasks">
      <h2 class="section-title">Задачи</h2>

      <template v-if="tasks.length">
        <RouterLink
          v-for="task in tasks"
          :key="task.id"
          :to="`/task/${task.slug}`"
          class="task-card"
        >
          <span class="task-num">{{ task.id }}</span>
          <div class="task-info">
            <strong>{{ task.title }}</strong>
            <span>{{ task.description }}</span>
          </div>
          <span class="arrow">&rarr;</span>
        </RouterLink>
      </template>

      <div v-else class="empty">
        <p>Список задач пока пуст. Задачи появятся здесь по мере выполнения.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.hero {
  margin-bottom: 2.5rem;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: var(--color-accent-soft);
  color: var(--color-accent-dark);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h1 {
  margin-top: 0.9rem;
  font-size: 2.4rem;
  line-height: 1.15;
  color: var(--color-text);
}

.subtitle {
  margin-top: 1rem;
  color: var(--color-text-muted);
  max-width: 64ch;
}

.section-title {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: var(--color-text);
}

.tasks {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.task-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  color: var(--color-text);
}

.task-num {
  flex: 0 0 auto;
  width: 2.5rem;
  height: 2.5rem;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: var(--color-text-invert);
  font-weight: 700;
  font-size: 1.1rem;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.task-info strong {
  font-size: 1.05rem;
}

.task-info span {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.arrow {
  margin-left: auto;
  color: var(--color-primary);
  font-size: 1.4rem;
  font-weight: 600;
}

.empty {
  padding: 2.5rem 1.5rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  text-align: center;
  color: var(--color-text-muted);
  background: var(--color-surface);
}
</style>