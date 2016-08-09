import marked from 'marked'
const renderer = new marked.Renderer()

renderer.paragraph = function(text) {
  return text
}

export default function customMarked(content) {
  return marked(content, {renderer})
}
