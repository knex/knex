<script>
import Split from 'split.js';

export default {
  mounted() {
    Split(['#editor', '#output']);
  },
};
</script>

<script setup>
import { shallowRef } from 'vue';
import { useDialect } from './dialect';

const { dialect } = useDialect();
const editorRef = shallowRef();
const outputRef = shallowRef();

const code = `// Knex code\nknex("table").select()\n`;
const sql = `--- generated SQL code\nselect\n  *\nfrom\n  "table"\n`;

const editorOptions = {
  scrollBeyondLastLine: false,
  wordWrap: 'on',
};

const outputEditorOptions = {
  readOnly: true,
  scrollBeyondLastLine: false,
  wordWrap: 'on',
};

function handleMountEditor(editor) {
  editorRef.value = editor;
}

function handleMountOutput(editor) {
  outputRef.value = editor;
}

function onChange(value) {
  let output = '--- generated SQL code\n';

  try {
    console.log({ dialect: dialect.value });

    output += eval(value).toQuery();
  } catch (err) {
    output = `--- ${err?.toString() ?? err}\n`;
  }

  outputRef.value.setValue(output);
}
</script>

<template>
  <div class="playground split">
    <vue-monaco-editor
      id="editor"
      language="typescript"
      theme="vs-dark"
      v-model:value="code"
      :options="editorOptions"
      :saveViewState="false"
      @mount="handleMountEditor"
      @change="onChange"
    />

    <vue-monaco-editor
      id="output"
      language="sql"
      theme="vs-dark"
      v-model:value="sql"
      :options="outputEditorOptions"
      :saveViewState="false"
      @mount="handleMountOutput"
    />
  </div>
</template>

<style scoped>
.playground {
  width: 100vw;
  height: 100vh;
  padding-top: var(--header-height);
}
</style>
