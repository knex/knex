import hljs from 'highlight.js/lib/core'
import sqlLang from 'highlight.js/lib/languages/sql'
import jsLang from 'highlight.js/lib/languages/javascript'
import tsLang from 'highlight.js/lib/languages/typescript'

hljs.registerLanguage('sql', sqlLang)
hljs.registerLanguage('js', jsLang)
hljs.registerLanguage('ts', tsLang)

export function js(content) {
  return hljs.highlight( content, { language: 'js', ignoreIllegals: true}).value
}

export function sql(content) {
  return hljs.highlight(content, { language: 'sql', ignoreIllegals: true}).value
}

export function ts(content) {
  return hljs.highlight(content, { language: 'ts', ignoreIllegals: true}).value
}
