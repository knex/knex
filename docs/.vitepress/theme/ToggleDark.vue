<script setup>
import { onMounted, ref, computed, watch } from 'vue';

const prefersDark = ref(false);
const setting = ref('auto');
const isDark = computed(
  () =>
    setting.value === 'dark' || (prefersDark.value && setting.value !== 'light')
);
const toggleDark = () => {
  setting.value = setting.value === 'dark' ? 'light' : 'dark';
  localStorage.setItem('color-scheme', setting.value);
};
watch(isDark, () => {
  document.documentElement.classList.toggle('dark', isDark.value);
});

onMounted(() => {
  prefersDark.value =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  setting.value = localStorage.getItem('color-scheme') || 'auto';
  document.documentElement.classList.toggle('dark', isDark.value);
});
</script>

<template>
  <a
    class="toggle-dark"
    tabindex="0"
    role="button"
    @click.prevent="toggleDark"
    @keydown.enter.prevent="toggleDark"
  >
    <transition name="fade" mode="out-in">
      <svg
        v-if="isDark"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        aria-hidden="true"
        role="img"
        class="iconify iconify--ph"
        width="32"
        height="32"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 256 256"
      >
        <path
          fill="currentColor"
          d="M216.7 152.6A91.9 91.9 0 0 1 103.4 39.3a92 92 0 1 0 113.3 113.3Z"
          opacity=".2"
        ></path>
        <path
          fill="currentColor"
          d="M224.3 150.3a8.1 8.1 0 0 0-7.8-5.7l-2.2.4A84 84 0 0 1 111 41.6a5.7 5.7 0 0 0 .3-1.8a7.9 7.9 0 0 0-10.3-8.1a100 100 0 1 0 123.3 123.2a7.2 7.2 0 0 0 0-4.6ZM128 212A84 84 0 0 1 92.8 51.7a99.9 99.9 0 0 0 111.5 111.5A84.4 84.4 0 0 1 128 212Z"
        ></path>
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        aria-hidden="true"
        role="img"
        class="iconify iconify--ph"
        width="32"
        height="32"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 256 256"
      >
        <circle
          cx="128"
          cy="128"
          r="60"
          fill="currentColor"
          opacity=".2"
        ></circle>
        <path
          fill="currentColor"
          d="M128 60a68 68 0 1 0 68 68a68.1 68.1 0 0 0-68-68Zm0 120a52 52 0 1 1 52-52a52 52 0 0 1-52 52Zm-8-144V16a8 8 0 0 1 16 0v20a8 8 0 0 1-16 0ZM43.1 54.5a8.1 8.1 0 1 1 11.4-11.4l14.1 14.2a8 8 0 0 1 0 11.3a8.1 8.1 0 0 1-11.3 0ZM36 136H16a8 8 0 0 1 0-16h20a8 8 0 0 1 0 16Zm32.6 51.4a8 8 0 0 1 0 11.3l-14.1 14.2a8.3 8.3 0 0 1-5.7 2.3a8.5 8.5 0 0 1-5.7-2.3a8.1 8.1 0 0 1 0-11.4l14.2-14.1a8 8 0 0 1 11.3 0ZM136 220v20a8 8 0 0 1-16 0v-20a8 8 0 0 1 16 0Zm76.9-18.5a8.1 8.1 0 0 1 0 11.4a8.5 8.5 0 0 1-5.7 2.3a8.3 8.3 0 0 1-5.7-2.3l-14.1-14.2a8 8 0 0 1 11.3-11.3ZM248 128a8 8 0 0 1-8 8h-20a8 8 0 0 1 0-16h20a8 8 0 0 1 8 8Zm-60.6-59.4a8 8 0 0 1 0-11.3l14.1-14.2a8.1 8.1 0 0 1 11.4 11.4l-14.2 14.1a8.1 8.1 0 0 1-11.3 0Z"
        ></path>
      </svg>
    </transition>
  </a>
</template>

<style scoped>
.toggle-dark {
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.5rem;
  cursor: pointer;
  color: var(--c-text);
  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
}
.toggle-dark:hover {
  color: var(--c-brand);
}
.toggle-dark svg {
  width: 1.3rem;
  vertical-align: middle;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
