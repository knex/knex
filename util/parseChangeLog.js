import marked from 'marked'

const renderer = new marked.Renderer()

function replaceTicket(text) {
  return text.replace(/#(\d+)/g, function(match, d) {
    return `[${match}](https://github.com/tgriesser/knex/issues/${d})`
  })
}

export default function parseChangeLog(text) {
  const tokens = marked.lexer(text, { renderer })

  const releases = []
  let currentChanges
  let nestedChanges

  while (tokens.length) {
    let token = tokens.shift()
    if (token.type === 'heading') {
      if (token.depth === 1) {
        const [version, date] = token.text.split('-').map(s => s.trim())
        currentChanges = []
        releases.push({ version, date, changes: currentChanges })
        continue
      }
      nestedChanges = []
      currentChanges.push({ title: token.text, changes: nestedChanges })
    }
    if (token.type === 'list_start') {
      let targetList = nestedChanges || currentChanges
      while (token.type !== 'list_end') {
        token = tokens.shift()
        if (token.type === 'text') {
          targetList.push(replaceTicket(token.text))
        }
      }
      if (nestedChanges) {
        nestedChanges = null
      }
    }
  }

  return releases
}
