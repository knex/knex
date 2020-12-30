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
  },
  {
    type: "text",
    content: "To reduce boilerplate and add inferred types, you can augment `Tables` interface in `'knex/types/tables'` module."
  },
  {
    type: "code",
    language: "ts",
    content: `
      import { knex } from 'knex';

      declare module 'knex/types/tables' {
        interface User {
          id: number;
          name: string;
          created_at: string;
          updated_at: string;
        }
        
        interface Tables {
          // This is same as specifying \`knex<User>('users')\`
          users: User;
          // For more advanced types, you can specify separate type
          // for base model, "insert" type and "update" type.
          // This is like specifying
          //    knex
          //    .insert<{ name: string }>({ name: 'name' })
          //    .into<{ name: string, id: number }>('users')
          users_composite: Knex.CompositeTableType<
            // This interface will be used for return type and 
            // \`where\`, \`having\` etc where full type is required 
            User,
            // Specifying "insert" type will also make sure
            // data matches interface in full. Meaning
            // if interface is \`{ a: string, b: string }\`,
            // \`insert({ a: '' })\` will complain about missing fields.
            // 
            // For example, this will require only "name" field when inserting
            // and make created_at and updated_at optional.
            // And "id" can't be provided at all.
            // Defaults to "base" type.
            Pick<User, 'name'> & Partial<Pick<User, 'created_at' | 'updated_at'>>,
            // This interface is used for "update()" calls.
            // As opposed to regular specifying interface only once,
            // when specifying separate update interface, user will be
            // required to match it  exactly. So it's recommended to
            // provide partial interfaces for "update". Unless you want to always
            // require some field (e.g., \`Partial<User> & { updated_at: string }\`
            // will allow updating any field for User but require updated_at to be
            // always provided as well.
            // 
            // For example, this wil allow updating all fields except "id".
            // "id" will still be usable for \`where\` clauses so
            //      knex('users_composite')
            //      .update({ name: 'name2' })
            //      .where('id', 10)\`
            // will still work.
            // Defaults to Partial "insert" type
            Partial<Omit<User, 'id'>>
          >;
        }
      }
    `
  }
];
