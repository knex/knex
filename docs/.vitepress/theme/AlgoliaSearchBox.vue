<script setup lang="ts">
import '@docsearch/css';
import docsearch from '@docsearch/js';
import { useRoute, useRouter, useData } from 'vitepress';
import { getCurrentInstance, onMounted, watch } from 'vue';
import type { DefaultTheme } from '../config';
import type { DocSearchHit } from '@docsearch/react/dist/esm/types';
const props = defineProps<{
  options: DefaultTheme.AlgoliaSearchOptions;
  multilang?: boolean;
}>();
const vm = getCurrentInstance();
const route = useRoute();
const router = useRouter();
watch(
  () => props.options,
  (value) => {
    update(value);
  }
);
onMounted(() => {
  initialize(props.options);
});
function isSpecialClick(event: MouseEvent) {
  return (
    event.button === 1 ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  );
}
function getRelativePath(absoluteUrl: string) {
  const { pathname, hash } = new URL(absoluteUrl);
  return pathname + hash;
}
function update(options: any) {
  if (vm && vm.vnode.el) {
    vm.vnode.el.innerHTML =
      '<div class="algolia-search-box" id="docsearch"></div>';
    initialize(options);
  }
}
const { lang } = useData();
// if the user has multiple locales, the search results should be filtered
// based on the language
const facetFilters: string[] = props.multilang ? ['lang:' + lang.value] : [];
if (props.options.searchParameters?.facetFilters) {
  facetFilters.push(...props.options.searchParameters.facetFilters);
}
watch(lang, (newLang, oldLang) => {
  const index = facetFilters.findIndex(
    (filter) => filter === 'lang:' + oldLang
  );
  if (index > -1) {
    facetFilters.splice(index, 1, 'lang:' + newLang);
  }
});
function initialize(userOptions: any) {
  docsearch(
    Object.assign({}, userOptions, {
      container: '#docsearch',
      searchParameters: Object.assign({}, userOptions.searchParameters, {
        // pass a custom lang facetFilter to allow multiple language search
        // https://github.com/algolia/docsearch-configs/pull/3942
        facetFilters,
      }),
      navigator: {
        navigate: ({ itemUrl }: { itemUrl: string }) => {
          const { pathname: hitPathname } = new URL(
            window.location.origin + itemUrl
          );
          // Router doesn't handle same-page navigation so we use the native
          // browser location API for anchor navigation
          if (route.path === hitPathname) {
            window.location.assign(window.location.origin + itemUrl);
          } else {
            router.go(itemUrl);
          }
        },
      },
      transformItems: (items: DocSearchHit[]) => {
        return items.map((item) => {
          // The original base URL of this website is apparently a GitHub pages domain
          // in which every page seems to start with the path `/knex`.
          // This effectively breaks the algolia search box in the `knexjs.org` domain
          // since all items in the search box link to pages with paths that start with
          // `/knex`, which in this domain seem to not start with `/knex`, so using
          // the search box effectively makes any result redirect to a 404 page.
          // This fix attempts to remove the `/knex` prefix from all results of
          // the search box.
          const url = new URL(item.url);
          if (url.pathname.startsWith('/knex'))
            url.pathname = url.pathname.replace('/knex', '');

          return Object.assign({}, item, {
            url: getRelativePath(url.href),
          });
        });
      },
      hitComponent: ({
        hit,
        children,
      }: {
        hit: DocSearchHit;
        children: any;
      }) => {
        const relativeHit = hit.url.startsWith('http')
          ? getRelativePath(hit.url as string)
          : hit.url;
        return {
          type: 'a',
          ref: undefined,
          constructor: undefined,
          key: undefined,
          props: {
            href: hit.url,
            onClick: (event: MouseEvent) => {
              if (isSpecialClick(event)) {
                return;
              }
              // we rely on the native link scrolling when user is already on
              // the right anchor because Router doesn't support duplicated
              // history entries
              if (route.path === relativeHit) {
                return;
              }
              // if the hits goes to another page, we prevent the native link
              // behavior to leverage the Router loading feature
              if (route.path !== relativeHit) {
                event.preventDefault();
              }
              router.go(relativeHit);
            },
            children,
          },
          __v: null,
        };
      },
    })
  );
}
</script>

<template>
  <div class="algolia-search-box" id="docsearch" />
</template>

<style>
.algolia-search-box {
  padding-top: 1px;
}
@media (min-width: 720px) {
  .algolia-search-box {
    padding-left: 8px;
  }
}
@media (min-width: 751px) {
  .algolia-search-box {
    min-width: 176.3px; /* avoid layout shift */
  }
  .algolia-search-box .DocSearch-Button-Placeholder {
    padding-left: 8px;
    font-size: 0.9rem;
    font-weight: 500;
  }
}
body .DocSearch {
  --docsearch-primary-color: var(--c-brand);
  --docsearch-modal-background: var(--c-white);
  --docsearch-hit-background: var(--c-white-dark);
  --docsearch-searchbox-focus-background: var(--c-white-dark);
  --docsearch-highlight-color: var(--docsearch-primary-color);
  --docsearch-searchbox-shadow: inset 0 0 0 2px var(--c-text-lighter);
  --docsearch-hit-shadow: 0 1px 3px 0 var(--c-white);
  --docsearch-text-color: var(--c-text);
  --docsearch-muted-color: var(--c-text-dark-1);
  --docsearch-searchbox-background: var(--c-white);
  --docsearch-footer-background: var(--c-white);
  --docsearch-modal-shadow: 0 3px 8px 0 var(--c-white-dark);
  --docsearch-hit-color: var(--c-text);
  --docsearch-footer-shadow: 0 -1px 0 0 var(--c-white-dark);
  --docsearch-key-gradient: linear-gradient(
    -225deg,
    var(--c-white-dark),
    var(--c-white)
  );
  --docsearch-key-shadow: inset 0 -2px 0 0 var(--c-white-dark),
    inset 0 0 1px 1px var(--c-white), 0 1px 2px 1px var(--c-white-darker);
}
</style>
