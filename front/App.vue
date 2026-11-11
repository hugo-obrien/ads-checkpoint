<script setup lang="ts">
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <RouterLink to="/" class="brand">
        <span class="brand-mark">A</span>
        <span class="brand-text">Алгоритмы и структуры данных</span>
      </RouterLink>
    </header>

    <RouterView/>

    <footer class="site-footer">
      <span>Контрольное задание · TypeScript + Vue</span>
    </footer>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-primary);
  color: var(--color-text-invert);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  max-width: 960px;
  margin: 0 auto;
  padding: 0.9rem 1.5rem;
  color: var(--color-text-invert);
  font-weight: 700;
  font-size: 1.05rem;
}

.brand:hover {
  color: var(--color-text-invert);
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: var(--color-text-invert);
  font-weight: 800;
  font-size: 1.1rem;
}

.site-footer {
  margin-top: auto;
  padding: 1.5rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  border-top: 1px solid var(--color-border);
}
</style>