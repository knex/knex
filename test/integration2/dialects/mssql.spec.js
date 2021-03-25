const { expect } = require('chai');
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
