export default [
  {
    type: "heading",
    size: "lg",
    content: "TypeScript Support",
    href: "typescript-support"
  },
  {
    type: "text",
    content: "While knex is written in JavaScript, officially supported TypeScript bindings are available (within the knex npm package).",
  },
  {
    type: "text",
    content: "However it is to be noted that TypeScript support is currently best-effort. Knex has a very flexible API and not all usage patterns can be type-checked and in most such cases we err on the side of flexibility. In particular, lack of type errors doesn't currently guarantee that the generated queries will be correct and therefore writing tests for them is recommended even if you are using TypeScript."
  },
  {
    type: "text",
    content: "Many of the APIs accept `TRecord` and `TResult` type parameters, using which we can specify the type of a row in the database table and the type of the result of the query respectively. This is helpful for auto-completion when using TypeScript-aware editors like VSCode."
  }
];