<script setup>
import DefaultTheme from 'vitepress/theme';
import { useData } from 'vitepress';
import { computed, defineAsyncComponent } from 'vue';
import SqlDialectSelector from './SqlDialectSelector.vue';
import ToggleDark from './ToggleDark.vue';

const { Layout } = DefaultTheme;
const { site, theme } = useData();

const AlgoliaSearchBox = defineAsyncComponent(() =>
  import('./AlgoliaSearchBox.vue')
);

// automatic multilang check for AlgoliaSearchBox
const isMultiLang = computed(() => Object.keys(site.value.langs).length > 1);
</script>

<template>
  <Layout>
    <template #navbar-search>
      <SqlDialectSelector />
      <AlgoliaSearchBox
        v-if="theme.algolia"
        :options="theme.algolia"
        :multilang="isMultiLang"
      />
      <ToggleDark />
    </template>
  </Layout>
</template>
