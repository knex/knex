---
layout: home
title: SQL Query Builder for Javascript
hero:
  name: Knex.js
  text: SQL query builder
  image:
    src: /knex-logo.svg
    alt: Logo knex
  actions:
    - theme: brand
      text: View guide
      link: /guide/
    - theme: alt
      text: Read blog
      link: /blog/
    - theme: alt
      text: Star on GitHub
      link: https://github.com/knex/knex
---

<script setup lang="ts">
import { computed } from 'vue';
import { data as posts } from './blog/posts.data.mjs';

const latestPost = computed(() => posts[0] ?? null);
</script>

<div class="container-home">

Knex.js is a batteries-included SQL query builder for JavaScript.

**Knex.js** (pronounced [/kəˈnɛks/](https://youtu.be/19Av0Lxml-I?t=521)) is a "batteries included" SQL query builder for **PostgreSQL**, **CockroachDB**, **MSSQL**, **MySQL**, **MariaDB**, **SQLite3**, **Better-SQLite3**, **Oracle**, and **Amazon Redshift** designed to be flexible, portable, and fun to use.

It features both traditional node style [callbacks](/guide/interfaces#callbacks) as well as a [promise](/guide/interfaces#promises) interface for cleaner async flow control, [a stream interface](/guide/interfaces#streams), full-featured [query](/guide/query-builder) and [schema](/guide/schema-builder) builders, [**transaction support (with savepoints)**](/guide/transactions), connection [pooling](/guide/#pool) and standardized responses between different query clients and dialects.

<div v-if="latestPost" class="home-blog-highlight">
  <p class="home-blog-kicker">From the blog</p>
  <p class="home-blog-title">
    <a :href="latestPost.url">{{ latestPost.title }}</a>
    <span>{{ latestPost.date }}</span>
  </p>
  <p>{{ latestPost.summary }}</p>
  <p><a href="/blog/">Browse all blog posts →</a></p>
</div>

</div>
