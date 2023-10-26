const { expect } = require('chai');
const { TYPES } = require('tedious');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');

async function fetchDefaultConstraint(knex, table, column) {
  const [result] = await knex.schema.raw(`
    SELECT default_constraints.name, default_constraints.definition
    FROM sys.all_columns
    INNER JOIN sys.tables
        ON all_columns.object_id = tables.object_id
    INNER JOIN sys.schemas
        ON tables.schema_id = schemas.schema_id
    INNER JOIN sys.default_constraints
        ON all_columns.default_object_id = default_constraints.object_id
    WHERE schemas.name = 'dbo'
      AND tables.name = '${table}'
      AND all_columns.name = '${column}'
  `);
  return result || { name: null, definition: null };
}

describe('MSSQL dialect', () => {
  getAllDbs()
    .filter((db) => db.startsWith('mssql'))
    .forEach((db) => {
      describe(db, () => {
        let knex;
        before(async () => {
          knex = getKnexForDb(db);
        });

        beforeEach(async () => {
          await knex.schema.createTable('test', function () {
            this.increments('id').primary();
            this.specificType('varchar', 'varchar(100)');
            this.string('nvarchar');
          });
        });

        after(async () => {
          await knex.destroy();
        });

        afterEach(async () => {
          await knex.schema.dropTable('test');
        });

        describe('column default handling', () => {
          describe('changing default value', () => {
            beforeEach(async () => {
              await knex.schema.alterTable('test', function () {
                this.string('name').defaultTo('test');
              });
            });
            it('can change the default value', async () => {
              await knex.schema.alterTable('test', function () {
                this.string('name').defaultTo('test2').alter();
              });
              const { definition } = await fetchDefaultConstraint(
                knex,
                'test',
                'name'
              );
              expect(definition).to.equal("('test2')");
            });
          });

          it('names default constraint', async () => {
            await knex.schema.alterTable('test', function () {
              this.string('name').defaultTo('knex');
            });
            const { name } = await fetchDefaultConstraint(knex, 'test', 'name');
            expect(name).to.equal('test_name_default');
          });
          it('names default constraint with supplied name', async () => {
            const constraintName = 'DF_test_name';
            await knex.schema.alterTable('test', function () {
              this.string('name').defaultTo('knex', { constraintName });
            });
            const { name } = await fetchDefaultConstraint(knex, 'test', 'name');
            expect(name).to.equal('DF_test_name');
          });
          it("doesn't name default constraint", async () => {
            const constraintName = '';
            await knex.schema.alterTable('test', function () {
              this.string('name').defaultTo('knex', { constraintName });
            });
            const { name } = await fetchDefaultConstraint(knex, 'test', 'name');
            // this is the default patten used by mssql if no constraint is defined
            expect(name).to.match(/^DF__test__name__[0-9A-Z]+$/);
          });
        });

        describe('comment limits', () => {
          // NOTE: We are using varchar, not nvarchar, so we can hit an odd number of bytes with our characters.
          const byteCount0 = "''";
          const byteCount7500 = "'" + 'X'.repeat(7500) + "'";
          const byteCountOver7500 = "'" + 'X'.repeat(7501) + "'";

          const tableTarget = { schemaName: 'dbo', tableName: 'test' };
          it('supports table comments of max 7500 bytes', async () => {
            // 0 works
            await expect(comment(knex, 'add', byteCount0, tableTarget)).to
              .eventually.be.fulfilled;

            // 7500 works
            await expect(comment(knex, 'update', byteCount7500, tableTarget)).to
              .eventually.be.fulfilled;

            // Over 7500 fails
            await expect(
              comment(knex, 'update', byteCountOver7500, tableTarget)
            ).to.eventually.be.rejectedWith(
              'The size associated with an extended property cannot be more than 7,500 bytes.'
            );
          });

          const columnTarget = { ...tableTarget, columnName: 'id' };
          it('supports column comments of max 7500 bytes', async () => {
            // 0 works
            await expect(comment(knex, 'add', byteCount0, columnTarget)).to
              .eventually.be.fulfilled;

            // 7500 works
            await expect(comment(knex, 'update', byteCount7500, columnTarget))
              .to.eventually.be.fulfilled;

            // Over 7500 fails
            await expect(
              comment(knex, 'update', byteCountOver7500, columnTarget)
            ).to.eventually.be.rejectedWith(
              'The size associated with an extended property cannot be more than 7,500 bytes.'
            );
          });

          // Characters in the supplementary plane need 4 bytes in UTF-16.
          // (They also happen to need 4 in UTF-8, so this estimate is a useful worst-case for a UTF-8 collation, as well.)
          const N = 7500 / 4;
          it(`worst-case allows at most ${N} characters with string length ${
            2 * N
          } in an nvarchar`, async () => {
            const astralPlaneCharacter = '\u{1D306}';
            const worstCaseComment = astralPlaneCharacter.repeat(N);

            // This works out because characters outside the BMP are counted as having length 2 by JavaScript's string.
            expect(worstCaseComment).to.have.property('length', 2 * N);

            // This length is the "shortest (in string.length), longest (in byte length)" comment that will fit.
            // Thus, for anything larger than 7500/2, we need to warn that the comment might be too many bytes.
            const asNvarcharLiteral = (text) => `N'${text}'`;
            await expect(
              comment(
                knex,
                'add',
                asNvarcharLiteral(worstCaseComment),
                columnTarget
              )
            ).to.eventually.be.fulfilled;

            // One more JS char (2 more bytes) is too much!
            const oneMoreCharIsTooMuch = 'X' + worstCaseComment;
            expect(oneMoreCharIsTooMuch).to.have.property('length', 2 * N + 1);
            await expect(
              comment(
                knex,
                'update',
                asNvarcharLiteral(oneMoreCharIsTooMuch),
                columnTarget
              )
            ).to.eventually.be.rejectedWith(
              'The size associated with an extended property cannot be more than 7,500 bytes.'
            );
          });
        });

        describe('unique table index with options object', () => {
          const tableName = 'test_unique_index_options';
          before(async () => {
            await knex.schema.createTable(tableName, function () {
              this.integer('x').notNull();
              this.integer('y').notNull();
            });
          });

          after(async () => {
            await knex.schema.dropTable(tableName);
          });

          it('accepts indexName in options object', async () => {
            const indexName = `AK_${tableName}_x_y`;
            await knex.schema.alterTable(tableName, function () {
              this.unique(['x', 'y'], { indexName });
            });
            await expect(
              knex
                .insert([
                  { x: 1, y: 1 },
                  { x: 1, y: 1 },
                ])
                .into(tableName)
            ).to.eventually.be.rejectedWith(new RegExp(indexName));
          });
        });

        describe('unique table constraint with options object', () => {
          const tableName = 'test_unique_constraint_options';
          before(async () => {
            await knex.schema.createTable(tableName, function () {
              this.integer('x').notNull();
              this.integer('y').notNull();
            });
          });

          after(async () => {
            await knex.schema.dropTable(tableName);
          });

          it('accepts indexName and constraint in options object', async () => {
            const indexName = `UK_${tableName}_x_y`;
            await knex.schema.alterTable(tableName, function () {
              this.unique(['x', 'y'], {
                indexName: indexName,
                useConstraint: true,
              });
            });
            await expect(
              knex
                .insert([
                  { x: 1, y: 1 },
                  { x: 1, y: 1 },
                ])
                .into(tableName)
            ).to.eventually.be.rejectedWith(new RegExp(indexName));
          });
        });

        describe('comment support', () => {
          const schemaName = 'dbo';
          const tableName = 'test_attaches_comments';
          const columnName = 'column_with_comment';
          const columnWithoutComment = 'column_without_comment';

          // Comments intentionally include single quotes, which require escaping in strings.
          const tableComment = "table's comment";
          const columnComment = "``column comment''";

          const tableWithoutComment = 'table_without_comment';

          before(async () => {
            await knex.schema.createTable(tableName, function () {
              this.comment(tableComment);
              this.string(columnName).comment(columnComment);
              this.string(columnWithoutComment);
            });
            await knex.schema.createTable(tableWithoutComment, function () {
              this.increments();
            });
          });

          after(async () => {
            await knex.schema.dropTable(tableName);
            await knex.schema.dropTable(tableWithoutComment);
          });

          it('attaches table comments', async () => {
            const commentText = await commentFor(knex, {
              schemaName,
              tableName,
            });

            expect(commentText).to.equal(tableComment);
          });

          it('attaches column comments', async () => {
            const commentText = await commentFor(knex, {
              schemaName,
              tableName,
              columnName,
            });

            expect(commentText).to.equal(columnComment);
          });

          it('updates table comments', async () => {
            const updatedTableComment = 'updated table comment';
            await knex.schema.alterTable(tableName, function () {
              this.comment(updatedTableComment);
            });

            const commentText = await commentFor(knex, {
              schemaName,
              tableName,
            });

            expect(commentText).to.equal(updatedTableComment);
          });

          it('updates column comments', async () => {
            const updatedColumnComment = 'updated column comment';
            await knex.schema.alterTable(tableName, function () {
              this.string(columnName).comment(updatedColumnComment).alter();
            });

            const commentText = await commentFor(knex, {
              schemaName,
              tableName,
              columnName,
            });

            expect(commentText).to.equal(updatedColumnComment);
          });

          it('adds column comments when altering and no pre-existing comment', async () => {
            const expectedComment = 'well it has a comment now';
            await knex.schema.alterTable(tableName, function () {
              this.string(columnWithoutComment)
                .comment(expectedComment)
                .alter();
            });

            const commentText = await commentFor(knex, {
              schemaName,
              tableName,
              columnName: columnWithoutComment,
            });

            expect(commentText).to.equal(expectedComment);
          });

          it('adds table comments when updating and no pre-existing comment', async () => {
            const tableName = tableWithoutComment;
            const expectedComment = 'comment';
            await knex.schema.alterTable(tableName, function () {
              this.comment(expectedComment);
            });

            const commentText = await commentFor(knex, {
              schemaName,
              tableName,
            });

            expect(commentText).to.equal(expectedComment);
          });

          /**
           * Returns the comment for `target`, if any.
           *
           * @param {Knex} knex
           * @param {{schemaName: string, tableName: string, columnName?: string}} target
           * @returns {Promise<string|undefined>}
           */
          async function commentFor(knex, target) {
            const columnSpecifier = target.columnName
              ? `N'Column', :columnName`
              : 'NULL, NULL';
            const result = await knex
              .from(
                knex.raw(
                  `fn_listextendedproperty(N'MS_Description', N'Schema', :schemaName, N'Table', :tableName, ${columnSpecifier})`,
                  target
                )
              )
              .select('value AS comment')
              .first();
            return result ? result.comment : undefined;
          }
        });

        describe('supports mapBinding config', async () => {
          it('can remap types', async () => {
            const query = knex('test')
              .where('varchar', { value: 'testing', type: TYPES.VarChar })
              .select('id');
            const { bindings } = query.toSQL().toNative();
            expect(bindings[0].type, TYPES.VarChar);
            expect(bindings[0].value, 'testing');

            // verify the query runs successfully
            await query;
          });
          it('undefined mapBinding result falls back to default implementation', async () => {
            const query = knex('test')
              .where('nvarchar', 'testing')
              .select('id');

            const { bindings } = query.toSQL().toNative();
            expect(bindings[0], 'testing');

            // verify the query runs successfully
            await query;
          });
        });
      });
    });
});

/**
 *
 * @param {Knex} knex
 * @param {'add' | 'update' | 'drop'} action
 * @param {string} rawQuotedComment No escaping is done. This should include any needed quote marks.
 * @param {{schemaName: string, tableName: string, columnName?: string}} target
 */
const comment = async (knex, action, rawQuotedComment, target) => {
  const { schemaName, tableName } = target;
  // NOTE: This does not escape any embedded single quotes!
  // (Since we control all the inputs here, we know we don't need to.)
  const lines = [
    `EXEC sp_${action}extendedproperty`,
    " @name = N'MS_Description'",
    action !== 'drop' ? `, @value = ${rawQuotedComment}` : '',
    `, @level0type = N'Schema', @level0name = N'${schemaName}'`,
    `, @level1type = N'Table', @level1name = N'${tableName}'`,
    target.columnName !== undefined
      ? `, @level2type = N'Column', @level2name = N'${target.columnName}'`
      : '',
  ];
  return await knex.schema.raw(lines.join(''));
};
