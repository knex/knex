import defaultTheme from 'vitepress/theme';
import Layout from './Layout.vue';
import { createDialect } from './dialect';
import SqlOutput from './SqlOutput.vue';
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
  },
};
