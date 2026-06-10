---
title: Blog
sidebar: false
outline: false
---

<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import BlogArchive from '../BlogArchive.vue';

const { params } = useData();
const page = computed(() => Number(params.value.page || '1'));
</script>

# Blog

<BlogArchive :page="page" />
