'use strict';

const path = require('path');
const sqlite3 = require('sqlite3');
const { expect } = require('chai');
const { execCommand } = require('cli-testlab');
const { getRootDir } = require('./cli-test-utils');
const KNEX = path.normalize(__dirname + '/../../bin/cli.js');

describe('migrate:unlock', () => {
    before(() => {
        process.env.KNEX_PATH = '../knex.js';
    });

    const rootDir = getRootDir();
    const dbPath = path.resolve(rootDir, 'db');

    it('should restore lock table to one row with is_locked=0', async () => {
        
        const db = await new sqlite3.Database(dbPath);
        // Seed multiple rows into the lock table
        await new Promise((resolve, reject) => {
            db.run('INSERT INTO knex_migrations_lock(is_locked) VALUES (?),(?),(?)', [1, 0, 1], (err) => {
                err ? reject(err) : resolve();
            });
        });
        await execCommand(`node ${KNEX} migrate:unlock \
            --client=sqlite3 --connection=${dbPath} \
            --migrations-directory=${rootDir}/migrations \
            create_rule_table`);

        const rows = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM knex_migrations_lock', {}, (err, rows) => {
                if (err) {
                    reject(err);
                }
                resolve(rows);
            });
        });
        expect(rows.length).to.equal(1);
        expect(rows[0].is_locked).to.equal(0);
        db.close();

    });

});
