import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('weather_cache', (t) => {
    t.increments('id').primary();
    t.text('cache_key').unique().notNullable();
    t.text('data').notNullable();
    t.text('expires_at').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('weather_cache');
}
