<script setup>
import DefaultTheme from 'vitepress/theme';
import { getScrollOffset, useRoute } from 'vitepress';
import { onMounted, onUnmounted, watch, nextTick } from 'vue';
import SqlDialectSelector from './SqlDialectSelector.vue';

const { Layout } = DefaultTheme;
const route = useRoute();

let activeSidebarLink = null;
let lastActiveHeading = null;

const getHeadings = () => {
  return Array.from(document.querySelectorAll('.VPDoc :where(h2,h3)')).filter(
    (el) => el.id
  );
};

const findActiveHeading = () => {
  const headings = getHeadings();
  if (!headings.length) {
    return null;
  }

  const offset = getScrollOffset() + 8;
  let active = null;
  for (const heading of headings) {
    const top = heading.getBoundingClientRect().top;
    if (top - offset > 0) {
      break;
    }
    active = heading;
  }
  return active;
};

const setSidebarActive = (headingId) => {
  if (activeSidebarLink) {
    activeSidebarLink.classList.remove('sidebar-active-heading');
  }
  activeSidebarLink = null;

  if (!headingId) {
    return;
  }

  const pathname = window.location.pathname;
  const selector = `.VPSidebar a.link[href="${pathname}#${headingId}"]`;
  const link = document.querySelector(selector);
  if (!link) {
    return;
  }

  link.classList.add('sidebar-active-heading');
  activeSidebarLink = link;

  const nav = link.closest('.VPSidebar .nav');
  if (nav && typeof link.scrollIntoView === 'function') {
    link.scrollIntoView({ block: 'nearest' });
  }
};

const updateSidebarActive = () => {
  const activeHeading = findActiveHeading();
  const headingId = activeHeading ? activeHeading.id : null;
  if (headingId === lastActiveHeading) {
    return;
  }
  lastActiveHeading = headingId;
  setSidebarActive(headingId);
};

let isTicking = false;
const onScroll = () => {
  if (isTicking) {
    return;
  }
  isTicking = true;
  requestAnimationFrame(() => {
    isTicking = false;
    updateSidebarActive();
  });
};

onMounted(() => {
  updateSidebarActive();
  window.addEventListener('scroll', onScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
});

watch(
  () => route.path,
  async () => {
    await nextTick();
    lastActiveHeading = null;
    updateSidebarActive();
  }
);
</script>

<template>
  <Layout>
    <template #nav-bar-content-before>
      <SqlDialectSelector />
    </template>
  </Layout>
</template>
