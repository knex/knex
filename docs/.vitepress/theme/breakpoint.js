import { computed, onMounted, onUnmounted, ref } from 'vue';

/**
 * @ref https://stackoverflow.com/a/63944126
 */
export function useBreakpoints() {
  let windowWidth = ref(window.innerWidth);

  const onWidthChange = () => (windowWidth.value = window.innerWidth);
  onMounted(() => window.addEventListener('resize', onWidthChange));
  onUnmounted(() => window.removeEventListener('resize', onWidthChange));

  /**
   * @ref https://getbootstrap.com/docs/5.3/layout/breakpoints/#available-breakpoints
   */
  const type = computed(() => {
    if (windowWidth.value < 576) return 'xs';
    if (windowWidth.value >= 576 && windowWidth.value < 768) return 'sm';
    if (windowWidth.value >= 768 && windowWidth.value < 992) return 'md';
    if (windowWidth.value >= 992 && windowWidth.value < 1200) return 'lg';
    if (windowWidth.value >= 1200 && windowWidth.value < 1400) return 'xl';
    else return 'xxl'; // Fires when windowWidth.value >= 1400
  });

  const width = computed(() => windowWidth.value);

  return { width, type };
}
