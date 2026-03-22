<script setup lang="ts">
import { computed } from 'vue';
import { data as posts } from './posts.data.mjs';
import { POSTS_PER_PAGE, resolveBlogPageLink } from './blog.constants';

const props = defineProps<{
  page: number;
}>();

const pageCount = computed(() => {
  return Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
});

const safePage = computed(() => {
  const parsed = Number(props.page || 1);
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return Math.min(Math.max(Math.trunc(parsed), 1), pageCount.value);
});

const pagePosts = computed(() => {
  const offset = (safePage.value - 1) * POSTS_PER_PAGE;
  return posts.slice(offset, offset + POSTS_PER_PAGE);
});

const pages = computed(() => {
  return Array.from({ length: pageCount.value }, (_, index) => index + 1);
});
</script>

<template>
  <div class="blog-archive">
    <p v-if="posts.length < 1">No blog posts yet.</p>

    <template v-else>
      <p>Page {{ safePage }} of {{ pageCount }}</p>

      <article v-for="post in pagePosts" :key="post.url">
        <h2><a :href="post.url">{{ post.title }}</a></h2>
        <p><em>{{ post.dateUtc }}</em></p>
        <p>{{ post.summary }}</p>
      </article>

      <nav v-if="pageCount > 1" aria-label="Blog pages">
        <a v-for="pageNumber in pages" :key="pageNumber" :href="resolveBlogPageLink(pageNumber)">
          <strong v-if="pageNumber === safePage">{{ pageNumber }}</strong>
          <span v-else>{{ pageNumber }}</span>
        </a>
      </nav>
    </template>
  </div>
</template>

<style scoped>
.blog-archive article {
  margin-top: 0.85rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--vp-c-divider);
}

.blog-archive article h2 {
  margin: 0;
  padding-top: 0;
  border-top: 0;
}

.blog-archive article p {
  margin-top: 0.65rem;
}

.blog-archive nav {
  margin-top: 1.25rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
</style>
