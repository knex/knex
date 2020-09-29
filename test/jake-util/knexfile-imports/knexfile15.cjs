/**
 * cjs import
 * mjs: migrations/seeds
 * @returns {Promise<import("../../../").Config>}
 * */
module.exports = async () => {
    return {
        ...((await import('../knexfile-esm/knexfile.cjs')).default),
        migrations: {
            directory: './mjs/migrations',
            loadExtensions: ['.mjs']
        },
        seeds: {
            directory: './mjs/seeds',
            loadExtensions: ['.mjs']
        },
    };
};