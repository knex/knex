<script setup>
import { watch, onMounted, nextTick } from 'vue';
import { useRoute } from 'vitepress';
import { useDialect } from './dialect';
import { syncDialectErrors } from './sidebarDialectErrors';
const { dialect } = useDialect();
const route = useRoute();

const switchExamples = () => {
  nextTick(() => {
    const outputs = document.querySelectorAll('.sql-output[data-dialect]');
    outputs.forEach((el) => {
      el.style.display = 'block';
    });

    document.querySelectorAll('.sql-output-group').forEach((group) => {
      let maxHeight = 0;
      // Preserve layout height so switching dialects doesn't jump the page.
      group.querySelectorAll('.sql-output').forEach((el) => {
        const height = el.scrollHeight || 0;
        if (height > maxHeight) {
          maxHeight = height;
        }
      });
      group.style.minHeight = maxHeight ? `${maxHeight}px` : '';
    });

    if (dialect.value === 'all') {
      outputs.forEach((el) => {
        el.style.display = 'block';
      });
      syncDialectErrors(null);
      return;
    }

    outputs.forEach((el) => {
      el.style.display = 'none';
    });
    document
      .querySelectorAll(`[data-dialect="${dialect.value}"]`)
      .forEach((el) => {
        el.style.display = 'block';
      });
    syncDialectErrors(dialect.value);
  });
};

watch(route, switchExamples);
watch(dialect, switchExamples);
onMounted(switchExamples);
</script>

<template>
  <select v-model="dialect" class="sql-dropdown">
    <option value="mysql">MySQL / MariaDB</option>
    <option value="postgres">PostgreSQL</option>
    <option value="cockroachdb">CockroachDB</option>
    <option value="redshift">Amazon Redshift</option>
    <option value="sqlite3">SQLite3</option>
    <option value="oracledb">OracleDB</option>
    <option value="mssql">MSSQL</option>
    <option value="all">All dialects</option>
  </select>
</template>

<style>
.sql-dropdown {
  border-radius: 8px;
  margin-right: 0.75rem;
  padding: 0.35rem 0.6rem;
  cursor: pointer;
  color: var(--vp-c-text-1);
  outline: none;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  font-size: 0.9rem;
  margin-left: 20px;
}
</style>
