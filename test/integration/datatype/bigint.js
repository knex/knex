/*global describe, it, expect, testPromise*/

'use strict';

var Promise = testPromise;

module.exports = function (knex) {
    var bigintTimestamp = 1464294366973;
    var negativeBigintTimestamp = -1464294366973;
    var unsafeBigint = 99071992547409911;
    var negativeUnsafeBigint = -99071992547409911;

    it('#test number mssql should not allow unsafe bigint', function () {
        if (!/mssql/i.test(knex.client.dialect)) {
            return Promise.resolve();
        }
        var constraintName = 'pk_id';
        var tableName = 'bigint_test';
        return knex.transaction(function (tr) {
            return tr.schema.dropTableIfExists(tableName)
                .then(function () {
                    return tr.schema.createTable(tableName, function (table) {
                        table.string('id').primary(constraintName);
                        table.bigInteger('expiry');
                    });
                });
        }).then(function () {
            return knex(tableName).where('expiry', unsafeBigint).select("*");
        }).map(function (row) {
            // triggers request execution
        }).then(function () {
            return knex(tableName).where('expiry', negativeUnsafeBigint).select("*");
        }).map(function (row) {
            // triggers request execution
        }).catch(function (err) {
            expect(err).to.be.an.instanceof(Error);
            expect(err.message).to.contain('Bigint must be safe integer or must be passed as string');
        });
    });

    it('#test number mssql should allow safe bigint', function () {
        if (!/mssql/i.test(knex.client.dialect)) {
            return Promise.resolve();
        }
        var constraintName = 'pk_id';
        var tableName = 'bigint_test';
        return knex.transaction(function (tr) {
            return tr.schema.dropTableIfExists(tableName)
                .then(function () {
                    return tr.schema.createTable(tableName, function (table) {
                        table.string('id').primary(constraintName);
                        table.bigInteger('expiry');
                    });
                });
        }).then(function () {
            return knex(tableName).insert({id : "positive", expiry: bigintTimestamp});
        }).then(function () {
            return knex(tableName).insert({id : "negative", expiry: negativeBigintTimestamp});
        }).then(function () {
            return knex(tableName).where('expiry', bigintTimestamp).select("*");
        }).map(function (row) {
            console.log(row);
            expect(row.id).to.equal('positive');
        }).then(function () {
            return knex(tableName).where('expiry', negativeBigintTimestamp).select("*");
        }).map(function (row) {
            console.log(row);
            expect(row.id).to.equal('negative');
        }).catch(function (err) {
            expect(err).to.be.undefined;
        });
    });

    it('#1781 - decimal value must not be converted to integer', function () {
        if (!/mssql/i.test(knex.client.dialect)) {
            return
        }

        var tableName = 'decimal_test'
        var value = 123.4567

        return knex.transaction(function (tr) {
            return tr.schema.dropTableIfExists(tableName)
                .then(function () {
                    return tr.schema.createTable(tableName, function (table) {
                        table.increments()
                        table.decimal('value', 14, 4).notNullable()
                    })
                })
        }).then(function () {
            return knex(tableName).insert({ value: value })
        }).then(function () {
            return knex(tableName).first('value')
        }).then(function (response) {
            expect(response.value).to.be.eql(value)
        })
    })
};
