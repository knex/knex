/**
 * cjs import
 * esm: migrations/seeds
 * @returns {Promise<import("../../../").Config>}
 * */
module.exports = async () => {
    return {
        ...(require('../knexfile-esm/knexfile.cjs')),
        migrations: {
            directory: './esm/migrations',
        },
        seeds: {
            directory: './esm/seeds',
        },
    };
};