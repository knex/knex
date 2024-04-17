import { install as VueMonacoEditorPlugin } from '@guolao/vue-monaco-editor';
import defaultTheme from 'vitepress/theme';
import Layout from './Layout.vue';
import { createDialect } from './dialect';
import SqlOutput from './SqlOutput.vue';
import Playground from './Playground.vue';
import './styles.css';

// @todo: hack, vite.config.ts define option seem not to work
globalThis.process = globalThis.process || {
  env: {},
};

export default {
  Layout,
  NotFound: defaultTheme.NotFound,

  enhanceApp({ app }) {
    createDialect(app);
    app.component('SqlOutput', SqlOutput);
    app.component('Playground', Playground);
    app.use(VueMonacoEditorPlugin, {
      paths: {
        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs',
      },
    });
  },
};
