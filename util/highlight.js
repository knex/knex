import hljs from 'highlight.js/lib/highlight'
import sqlLang from 'highlight.js/lib/languages/sql'
import jsLang from 'highlight.js/lib/languages/javascript'

hljs.registerLanguage('sql', sqlLang)
hljs.registerLanguage('js', jsLang)

export function js(content) {
  return hljs.highlight('js', content, true).value
}

export function sql(content) {
  return hljs.highlight('sql', content, true).value
}
