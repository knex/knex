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

        // Clean-up test specific tables
        after(async function () {
            // Drop table (Trigger is removed with table)
            await knex.schema.dropTable(primaryTable);
            await knex.schema.dropTable(secondaryTable);
        });

        // Reset tables for each test
        beforeEach(async function () {
            if (knex.client.driverName !== 'mssql') {
                return;
            }

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
                    return;
                }

                // Create trigger
                await knex.raw(`
                    GO
                    /****** Object:  Trigger [dbo].[${triggerName}]    Script Date: 12/9/2020 10:52:56 AM ******/
                    SET ANSI_NULLS ON
                    GO
                    SET QUOTED_IDENTIFIER ON
                    GO
                    CREATE TRIGGER [dbo].[${triggerName}] ON [dbo].[${secondaryTable}]
                    AFTER INSERT
                    AS 
                    BEGIN
                        -- SET NOCOUNT ON added to prevent extra result sets from
                        -- interfering with SELECT statements.
                        SET NOCOUNT ON;

                        BEGIN
                            update pt
                            set pt.${primaryLink} = i.id
                            from Inserted as i
                            inner join dbo.${primaryTable} as pt
                                on pt.id = i.${secondaryLink}
                        END
                    END
                `);
            });

            it('#4152 Should allow returns with inserts on tables with triggers', async function () {
                if (knex.client.driverName !== 'mssql') {
                    return true;
                }

                let reachedEnd = false;

                await knex.transaction(async function () {
                    let insertResults;

                    async function insertWithReturn() {
                        const primaryId = await knex(primaryTable).insert([insertPrimary], ["id"]);
                        insertSecondary[secondaryLink] = primaryId[0];

                        // Test retrieve with trigger
                        insertResults = await knex(secondaryTable).insert([insertSecondary], ["id"]);
                    }

                    await insertWithReturn();

                    expect(insertResults).to.be.finite;

                    reachedEnd = true;
                });

                expect(reachedEnd).to.be(true);
            });
        });

        describe("Deletes with Triggers", function () {
            // Trigger Name
            const triggerName = 'tr_test_delete_with_trigger';

            before(async function () {
                if (knex.client.driverName !== 'mssql') {
                    return;
                }

                await knex.raw(`
                    GO
                    /****** Object:  Trigger [dbo].[${triggerName}]    Script Date: 12/9/2020 10:52:56 AM ******/
                    SET ANSI_NULLS ON
                    GO
                    SET QUOTED_IDENTIFIER ON
                    GO
                    CREATE TRIGGER [dbo].[${triggerName}] ON [dbo].[${secondaryTable}]
                    AFTER DELETE
                    AS 
                    BEGIN
                        -- SET NOCOUNT ON added to prevent extra result sets from
                        -- interfering with SELECT statements.
                        SET NOCOUNT ON;

                        BEGIN
                            delete pt
                            where id = d.${secondaryLink}
                        END
                    END
                `);
            })
            it('#4152 Should allow returns with deletes on tables with triggers', async function () {
                if (knex.client.driverName !== 'mssql') {
                    return true;
                }

                await knex.transaction(async function () {
                    let insertedId;
                    let deletedId;

                    let reachedEnd = false;

                    async function insertWithReturn() {
                        // Setup primary table for trigger use case
                        const primaryId = await knex(primaryTable).insert([insertPrimary], ["id"]);
                        insertSecondary[secondaryLink] = primaryId[0];

                        // Insert to table with trigger to test delete
                        insertedId = await knex(secondaryTable).insert([insertSecondary], ["id"]);
                    }

                    async function deleteTriggerTable() {
                        // Test returning value from delete statement on a table with a trigger
                        deletedId = await knex(secondaryTable).whereRaw(`id = ${insertedId}`).delete(["id"]);
                    }

                    await insertWithReturn();
                    await deleteTriggerTable();

                    expect(deletedId).to.be.finite;

                    reachedEnd = true;
                });

                expect(reachedEnd).to.be(true);
            });
        });
    });
};