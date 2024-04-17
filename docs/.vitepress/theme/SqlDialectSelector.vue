<script setup>
import { watch, onMounted, nextTick } from 'vue';
import { useRoute } from 'vitepress';
import { useDialect } from './dialect';
const { dialect } = useDialect();
const route = useRoute();

const switchExamples = () => {
  nextTick(() => {
    document.querySelectorAll('[data-dialect]').forEach((el) => {
      el.style.display = 'none';
    });
    document
      .querySelectorAll(`[data-dialect="${dialect.value}"]`)
      .forEach((el) => {
        el.style.display = 'block';
      });
  });
};

watch(route, switchExamples);
watch(dialect, switchExamples);
onMounted(switchExamples);
</script>

<template>
  <select v-model="dialect" class="sql-dropdown item nav-link">
    <option value="mysql">MySQL / MariaDB</option>
    <option value="mysql2">MySQL2</option>
    <option value="postgres">PostgreSQL</option>
    <option value="pgnative">PG Native</option>
    <option value="cockroachdb">CockroachDB</option>
    <option value="redshift">Amazon Redshift</option>
    <option value="sqlite3">SQLite3</option>
    <option value="oracledb">OracleDB</option>
    <option value="mssql">MSSQL</option>
  </select>
</template>

<style>
.sql-dropdown {
  border-radius: 8px;
  margin-left: 1rem;
  padding: 0.5rem 0.4rem;
  cursor: pointer;
  color: var(--c-text);
  outline: none;
  background: var(--c-white-dark);
}
</style>
