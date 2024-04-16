<script>
import Split from 'split.js';

export default {
  mounted() {
    Split(['#editor', '#output']);
  },
};
</script>

<template>
  <div class="playground split">
    <div id="editor">
      Editor
    </div>

    <div id="output">
      Output
    </div>
  </div>
</template>

<style scoped>
.playground {
  width: 100vw;
  height: 100vh;
  padding-top: var(--header-height);
}
</style>
