import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	age: integer('age').notNull(),
	lifespan: integer('lifespan').default(80).notNull(),
	weeklyAvailableTime: integer('weekly_available_time').default(112).notNull() // 16 * 7 = 112 (assuming 8h sleep)
});

export const affirmation = sqliteTable('affirmation', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	text: text('text').notNull()
});

export const block = sqliteTable('block', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	color: text('color').notNull().default('#cccccc'),
	timeAllocation: integer('time_allocation').notNull(), // Default weekly hours
	userId: integer('user_id').references(() => user.id).notNull()
});

export const weeklyObjective = sqliteTable('weekly_objective', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	blockId: integer('block_id').references(() => block.id).notNull(),
	text: text('text').notNull(),
	weekStartDate: text('week_start_date').notNull(), // ISO date string YYYY-MM-DD
	isCompleted: integer('is_completed', { mode: 'boolean' }).default(false).notNull()
});

export const scheduleAllocation = sqliteTable('schedule_allocation', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	blockId: integer('block_id').references(() => block.id).notNull(),
	dayOfWeek: integer('day_of_week').notNull(), // 0=Monday, 6=Sunday
	hourSlot: integer('hour_slot').notNull(), // 0-23
	weekStartDate: text('week_start_date').notNull() // ISO date string YYYY-MM-DD
});

