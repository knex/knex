/** */
export default async () => {
  const { default: config } = await import(
    '../knexfile-esm-module/knexfile.js'
  );
  return {
    ...config,
    migrations: {
      ...config.migrations,
      directory: './mjs/migrations', // re-dir
    },
    seeds: {
      ...config.seeds,
      directory: './mjs/seeds', // re-dir
    },
  };
};
