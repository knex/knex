<!--.vitepress/theme/MyLayout.vue-->
<script setup>
import DefaultTheme from 'vitepress/theme'
import ToggleDark from './ToggleDark.vue'
const { Layout } = DefaultTheme

</script>

<template>
  <Layout>
    <template #navbar-search>
      <ToggleDark />
    </template>
  </Layout>
</template>