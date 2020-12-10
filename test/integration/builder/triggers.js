'use strict';

const { expect } = require('chai');

module.exports = function (knex) {
    describe('Triggers', function () {
        // Reused variables
        // Table Names
        const primaryTable = 'test_return_with_trigger_primary';
        const secondaryTable = 'test_return_with_trigger_secondary';

        // Foreign Key Column Names
        const primaryLink = 'foreign_id';
        const secondaryLink = 'looping_id';

        // Create proper environment for tests
        before(async function () {
            if (knex.client.driverName !== 'mssql') {
                this.skip();
            }

            await knex.schema.hasTable('users').then(async function (exists) {
                if (exists) {
                    await knex.schema.dropTable(primaryTable);
                    await knex.schema.dropTable(secondaryTable);
                }

                // Create tables
                await knex.schema.createTable(primaryTable, function (table) {
                    table.increments();
                    table.string("data");
                    table.integer(primaryLink);
                });

                await knex.schema.createTable(secondaryTable, function (table) {
                    table.increments();
                    table.string("data");
                    table.integer(secondaryLink);
                });
            });
        });

        // Clean-up test specific tables
        after(async function () {
            if (knex.client.driverName !== 'mssql') {
                return;
            }

            // Drop table (Trigger is removed with table)
            await knex.schema.dropTable(primaryTable);
            await knex.schema.dropTable(secondaryTable);
        });

        // Reset tables for each test
        beforeEach(async function () {
            // "Truncate" tables instead of recreate for each test for speed gains
            await knex.raw(`
                delete from ${primaryTable} dbcc checkident('${primaryTable}', reseed, 0);
                delete from ${secondaryTable} dbcc checkident('${secondaryTable}', reseed, 0);
            `);
        })

        describe("Inserts with Triggers", function () {
            // Trigger Name
            const triggerName = 'tr_test_insert_with_trigger';

            before(async function () {
                if (knex.client.driverName !== 'mssql') {
                    this.skip();
                }

                // Create trigger
                await knex.raw(`
                    CREATE TRIGGER [${triggerName}] ON [${secondaryTable}]
                    AFTER INSERT
                    AS 
                    BEGIN
                        SET NOCOUNT ON;

                        BEGIN
                            update pt
                            set pt.${primaryLink} = i.id
                            from Inserted as i
                            inner join ${primaryTable} as pt
                                on pt.id = i.${secondaryLink}
                        END
                    END
                `);
            });

            it('#4152 Should allow returns with inserts on tables with triggers', async function () {

                let reachedEnd = false;

                await knex.transaction(async function () {
                    let insertResults;

                    async function insertWithReturn() {
                        const insertPrimary = {
                            data: "Testing Data"
                        };

                        const insertSecondary = {
                            data: "Test Linking"
                        }

                        const primaryId = await knex(primaryTable).insert([insertPrimary], ["id"]);
                        insertSecondary[secondaryLink] = primaryId[0];

                        // Test retrieve with trigger
                        insertResults = (await knex(secondaryTable).insert([insertSecondary], ["id"]))[0];
                    }

                    await insertWithReturn();

                    expect(Number.parseInt(insertResults)).to.be.finite;

                    reachedEnd = true;
                });

                expect(reachedEnd).to.be.true;
            });
        });

        describe("Deletes with Triggers", function () {
            // Trigger Name
            const triggerName = 'tr_test_delete_with_trigger';

            before(async function () {
                if (knex.client.driverName !== 'mssql') {
                    this.skip();
                }

                await knex.raw(`
                    CREATE TRIGGER [dbo].[${triggerName}] ON [dbo].[${secondaryTable}]
                    AFTER DELETE
                    AS 
                    BEGIN
                        SET NOCOUNT ON;

                        BEGIN
                            delete ${primaryTable}
                            from ${primaryTable} as pt
                                inner join deleted as d
                                    on pt.id = d.${secondaryLink}
                        END
                    END
                `);
            })
            it('#4152 Should allow returns with deletes on tables with triggers', async function () {
                let reachedEnd = false;

                await knex.transaction(async function () {
                    let insertedId;
                    let deletedId;

                    async function insertWithReturn() {
                        const insertPrimary = {
                            data: "Testing Data"
                        };

                        const insertSecondary = {
                            data: "Test Linking"
                        }

                        // Setup primary table for trigger use case
                        const primaryId = await knex(primaryTable).insert([insertPrimary], ["id"]);
                        insertSecondary[secondaryLink] = primaryId[0];

                        // Insert to table with trigger to test delete
                        insertedId = (await knex(secondaryTable).insert([insertSecondary], ["id"]))[0];
                    }

                    async function deleteTriggerTable() {
                        // Test returning value from delete statement on a table with a trigger
                        deletedId = (await knex(secondaryTable).whereRaw(`id = ${insertedId}`).delete(["id"]))[0];
                    }

                    await insertWithReturn();
                    await deleteTriggerTable();

                    expect(Number.parseInt(deletedId)).to.be.finite;

                    reachedEnd = true;
                });

                expect(reachedEnd).to.be.true;
            });
        });
    });
};