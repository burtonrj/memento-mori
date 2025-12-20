import { createClient } from '@libsql/client';

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url) throw new Error('DATABASE_URL is not set');

const client = createClient({ url, authToken });

async function resetDatabase() {
	console.log('Dropping existing tables...');
	
	// Drop tables in correct order (respect foreign keys)
	const dropStatements = [
		'DROP TABLE IF EXISTS schedule_allocation',
		'DROP TABLE IF EXISTS weekly_objective',
		'DROP TABLE IF EXISTS objective',
		'DROP TABLE IF EXISTS block',
		'DROP TABLE IF EXISTS necessity_block',
		'DROP TABLE IF EXISTS affirmation',
		'DROP TABLE IF EXISTS user'
	];

	for (const sql of dropStatements) {
		try {
			await client.execute(sql);
			console.log(`  ✓ ${sql}`);
		} catch (e) {
			console.log(`  ✗ ${sql} - ${e}`);
		}
	}

	console.log('\nCreating new tables...');
	
	// Create new tables
	const createStatements = [
		`CREATE TABLE user (
			id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
			birth_date text DEFAULT '1990-01-01' NOT NULL,
			lifespan integer DEFAULT 80 NOT NULL,
			purpose_label text DEFAULT '' NOT NULL
		)`,
		`CREATE TABLE affirmation (
			id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
			text text NOT NULL
		)`,
		`CREATE TABLE necessity_block (
			id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
			name text NOT NULL,
			color text DEFAULT '#cccccc' NOT NULL,
			sort_order integer DEFAULT 0 NOT NULL,
			user_id integer NOT NULL,
			FOREIGN KEY (user_id) REFERENCES user(id) ON UPDATE no action ON DELETE no action
		)`,
		`CREATE TABLE objective (
			id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
			category text NOT NULL,
			text text NOT NULL,
			is_completed integer DEFAULT false NOT NULL,
			sort_order integer DEFAULT 0 NOT NULL
		)`,
		`CREATE TABLE schedule_allocation (
			id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
			block_type text NOT NULL,
			necessity_block_id integer,
			day_of_week integer NOT NULL,
			hour_slot integer NOT NULL,
			FOREIGN KEY (necessity_block_id) REFERENCES necessity_block(id) ON UPDATE no action ON DELETE no action
		)`
	];

	for (const sql of createStatements) {
		try {
			await client.execute(sql);
			const tableName = sql.match(/CREATE TABLE (\w+)/)?.[1] || 'unknown';
			console.log(`  ✓ Created ${tableName}`);
		} catch (e) {
			console.log(`  ✗ Error: ${e}`);
		}
	}

	console.log('\nDatabase reset complete!');
}

resetDatabase().catch(console.error);
