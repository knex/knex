import { watch, ref, nextTick, inject } from 'vue';

export function createDialect(app) {
  const dialect = ref('mysql');

  if (!import.meta.url) {
    watch(dialect, (value) => {
      localStorage.setItem('sql-dialect', value);
    });
    nextTick(() => {
      const value = localStorage.getItem('sql-dialect');
      if (value) {
        dialect.value = value;
      }
    });
  }

  // provide for later inject
  app.provide('dialect', dialect);

  // expose $dialect to templates
  Object.defineProperty(app.config.globalProperties, '$dialect', {
    get() {
      return dialect.value;
    },
  });

  return {
    dialect,
  };
}

export function useDialect() {
  const dialect = inject('dialect');

  return {
    dialect,
  };
}
