<script>
import Split from 'split.js';

export default {
  mounted() {
    Split(['#editor', '#output']);
  },
};
</script>

<script setup>
import Knex from 'knex';
import { shallowRef, watch } from 'vue';
import * as sqlFormatter from "sql-formatter";
import { useDialect } from './dialect';

const formatter = {
  pg: "postgresql",
  pgnative: "postgresql",
  mysql: "mysql",
  mysql2: "mysql",
  cockroachdb: "postgresql",
  redshift: "redshift",
  sqlite3: "sqlite",
  oracledb: "plsql",
  mssql: "tsql",
};

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

  fetch('/playground-assets/types/index.d.ts')
    .then((res) => res.text())
    .then((typeRes) => {
      const mappedTypes = typeRes
        .replace(/^import .*$/gmu, '')
        .replace(/[^ ]export /gu, ' ')
        .replace(
          'declare function knex<TRecord extends {} = any, TResult = unknown[]>(\n  config: Knex.Config | string\n): Knex<TRecord, TResult>;',
          'declare const knex: Knex.Client & (<TRecord extends {} = any, TResult = unknown[]>(config: Knex.Config | string) => Knex<TRecord, TResult>);'
        );

      // @ts-ignore
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        mappedTypes,
        'knex.d.ts'
      );
    })
    .catch(() => {
      window.location.reload();
    });
}

function handleMountOutput(editor) {
  outputRef.value = editor;
}

watch(dialect, () => {
  onChange(editorRef.value.getValue());
});

function onChange(value) {
  let output = '--- generated SQL code\n';

  try {
    const knex = Knex({ client: dialect.value });

    output += eval(value).toQuery();

    try {
      output = sqlFormatter.format(output, {
        language: formatter[dialect.value],
      });
    } catch (e) {
      output += `\n--- sqlFormatter failed to run: ${e?.toString() ?? e}\n`;
    }
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
