<script setup>
import DefaultTheme from 'vitepress/theme';
import { getScrollOffset, useData, useRoute } from 'vitepress';
import { computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { formatUtcDate } from '../../src/blog/date';
import SqlDialectSelector from './SqlDialectSelector.vue';

const { Layout } = DefaultTheme;
const route = useRoute();
const { frontmatter } = useData();
const isBlogPostPage = computed(() => route.path.startsWith('/blog/posts/'));

const blogPostDateUtc = computed(() => {
  if (!isBlogPostPage.value) {
    return '';
  }

  const rawDate = frontmatter.value?.date;
  if (!rawDate) {
    return '';
  }

  const timestamp = Date.parse(String(rawDate));
  if (!Number.isFinite(timestamp)) {
    return '';
  }

  return formatUtcDate(timestamp);
});

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

const updateUrlHash = (headingId) => {
  if (typeof window === 'undefined') {
    return;
  }

  const pathname = window.location.pathname;
  const currentHash = window.location.hash.replace(/^#/, '');
  if (!headingId) {
    if (!window.location.hash) {
      return;
    }
    window.history.replaceState(null, '', pathname);
    return;
  }

  if (currentHash === headingId) {
    return;
  }

  window.history.replaceState(null, '', `${pathname}#${headingId}`);
};

const updateSidebarActive = () => {
  const activeHeading = findActiveHeading();
  const headingId = activeHeading ? activeHeading.id : null;
  if (headingId === lastActiveHeading) {
    return;
  }
  lastActiveHeading = headingId;
  setSidebarActive(headingId);
  updateUrlHash(headingId);
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
    <template #doc-before>
      <nav
        v-if="isBlogPostPage"
        class="blog-post-nav blog-post-nav-top"
        aria-label="Blog post navigation"
      >
        <a href="/blog/">← Back to all blog posts</a>
        <p v-if="blogPostDateUtc" class="blog-post-date">
          <em>{{ blogPostDateUtc }}</em>
        </p>
      </nav>
    </template>
    <template #doc-after>
      <nav
        v-if="isBlogPostPage"
        class="blog-post-nav blog-post-nav-bottom"
        aria-label="Blog post navigation"
      >
        <a href="/blog/">← Back to all blog posts</a>
      </nav>
    </template>
  </Layout>
</template>
