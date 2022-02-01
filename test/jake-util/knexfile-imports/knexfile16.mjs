import config from '../knexfile-mjs/knexfile.mjs'
/**
 * mjs knexfile provides cjs migrations
 */
export default {
    ...config,
    migrations: {
        ...config.migrations,
        directory: './cjs/migrations',
        loadExtensions: ['.cjs']
    },
    seeds: {
        ...config.seeds,
        directory: './cjs/seeds',
        loadExtensions: ['.cjs']
    }
}