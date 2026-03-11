import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('favorites', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.text('city').notNullable();
    t.text('country').notNullable().defaultTo('');
    t.text('created_at').defaultTo(knex.fn.now());
    t.unique(['user_id', 'city']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('favorites');
}
