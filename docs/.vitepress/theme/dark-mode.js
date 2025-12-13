import { ref, computed, inject } from 'vue';

export function createDarkMode(app) {
  const prefersDark = ref(false);
  const setting = ref('auto');

  const isDark = computed(
    () =>
      setting.value === 'dark' ||
      (prefersDark.value && setting.value !== 'light')
  );
  const toggleDark = () => {
    setting.value = setting.value === 'dark' ? 'light' : 'dark';
    localStorage.setItem('color-scheme', setting.value);
  };

  prefersDark.value =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  setting.value = localStorage.getItem('color-scheme') || 'auto';

  app.provide('is-dark', { isDark, toggleDark });
}

export function useDarkMode() {
  return inject('is-dark');
}
