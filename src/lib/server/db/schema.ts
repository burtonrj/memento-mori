import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	birthDate: text('birth_date').default('1990-01-01').notNull(),
	lifespan: integer('lifespan').default(80).notNull(),
	// Primary Focus block customization
	purposeLabel: text('purpose_label').default('').notNull() // e.g., "Game Oracle", "MMA", "Fatherhood"
});

export const affirmation = sqliteTable('affirmation', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	text: text('text').notNull()
});

// Necessity blocks - always exactly 4 blocks
export const necessityBlock = sqliteTable('necessity_block', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(), // Default: Work, Chores, Relaxation, Study
	color: text('color').notNull().default('#cccccc'),
	sortOrder: integer('sort_order').notNull().default(0), // 0-3 for the four blocks
	userId: integer('user_id').references(() => user.id).notNull()
});

// Objectives - three types based on category
export type ObjectiveCategory = 'long-term-purpose' | 'weekly-purpose' | 'weekly-necessity';

export const objective = sqliteTable('objective', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	category: text('category').notNull(), // 'long-term-purpose', 'weekly-purpose', 'weekly-necessity'
	text: text('text').notNull(),
	isCompleted: integer('is_completed', { mode: 'boolean' }).default(false).notNull(),
	sortOrder: integer('sort_order').notNull().default(0) // For ordering within category
});

// Schedule allocations - now references either 'purpose' or a necessity block
export const scheduleAllocation = sqliteTable('schedule_allocation', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	blockType: text('block_type').notNull(), // 'purpose' or 'necessity'
	necessityBlockId: integer('necessity_block_id').references(() => necessityBlock.id), // null if purpose
	dayOfWeek: integer('day_of_week').notNull(), // 0=Monday, 6=Sunday
	hourSlot: integer('hour_slot').notNull() // 0-23
});

