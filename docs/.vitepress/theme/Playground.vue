<script setup>
import Knex from 'knex';
import * as sqlFormatter from 'sql-formatter';
import Split from 'split.js';
import { computed, onMounted, ref, shallowRef, watch } from 'vue';

import { useBreakpoints } from './breakpoint';
import { useDialect } from './dialect';

const formatter = {
  cockroachdb: 'postgresql',
  mssql: 'tsql',
  mysql: 'mysql',
  mysql2: 'mysql',
  oracledb: 'plsql',
  pg: 'postgresql',
  pgnative: 'postgresql',
  redshift: 'redshift',
  sqlite3: 'sqlite',
};

const { dialect } = useDialect();
const { type } = useBreakpoints();
const isVertical = computed(() => ['xs', 'sm'].includes(type.value));

const split = shallowRef();
const sql = ref('');
const code = ref('');

onMounted(() => {
  split.value = Split(['#editor', '#output'], {
    direction: isVertical.value ? 'vertical' : 'horizontal',
    sizes: [50, 50],
  });
});

watch(isVertical, () => {
  split.value?.destroy(false, false);

  split.value = Split(['#editor', '#output'], {
    direction: isVertical.value ? 'vertical' : 'horizontal',
    sizes: [50, 50],
  });
});

const editorOptions = {
  scrollBeyondLastLine: false,
  wordWrap: 'on',
};

const outputEditorOptions = {
  readOnly: true,
  scrollBeyondLastLine: false,
  wordWrap: 'on',
};

function handleMountEditor() {
  code.value = (() => {
    const hash = location.hash.slice(1);
    const code = '// Knex code\nknex("table").select()\n';

    try {
      return hash ? decodeURIComponent(atob(hash)) || code : code;
    } catch {
      return code;
    }
  })();

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

watch([code, dialect], () => {
  let output = '--- generated SQL code\n';

  try {
    const knex = Knex({ client: dialect.value });

    output += eval(code.value).toQuery();

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

  sql.value = `${output}\n`;

  window.history.replaceState(
    null,
    '',
    `#${btoa(encodeURIComponent(code.value))}`
  );
});
</script>

<template>
  <div
    class="playground split"
    :class="{ 'split-vertical': isVertical, 'split-horizontal': !isVertical }"
  >
    <vue-monaco-editor
      id="editor"
      language="typescript"
      theme="vs-dark"
      v-model:value="code"
      :options="editorOptions"
      :saveViewState="false"
      @mount="handleMountEditor"
    />

    <vue-monaco-editor
      id="output"
      language="sql"
      theme="vs-dark"
      v-model:value="sql"
      :options="outputEditorOptions"
      :saveViewState="false"
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
