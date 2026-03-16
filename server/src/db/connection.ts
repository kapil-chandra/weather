import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: config.databasePath,
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve(__dirname, 'migrations'),
  },
});

export default db;
