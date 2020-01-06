
export const client = 'sqlite3';

export const connection = {
  filename: __dirname + '/../test.sqlite3',
};

export const migrations = {
  directory: __dirname + '/../knexfile_migrations',
};

export const seeds = {
  directory: __dirname + '/../knexfile_seeds',
};
