import { db } from './index';
import { user, affirmation, block, weeklyObjective, scheduleAllocation } from './schema';
import { eq, and, sql, ne } from 'drizzle-orm';

export const getDeathClock = async () => {
	const userData = await db.select().from(user).limit(1);
	if (!userData.length) return null;

	const { age, lifespan, weeklyAvailableTime } = userData[0];
	const yearsLeft = lifespan - age;
	const hoursLeft = Math.floor(yearsLeft * 365.25 * 24);

	return {
		age,
		lifespan,
		weeklyAvailableTime,
		hoursLeft
	};
};

export const getRandomAffirmation = async () => {
	// SQLite specific random ordering
	const result = await db.select().from(affirmation).orderBy(sql`RANDOM()`).limit(1);
	return result[0]?.text || "Memento Mori";
};

export const getWeeklyData = async (weekStartDate: string) => {
	// Clean up any data from previous weeks
	// Only delete objectives from previous weeks, keep schedule allocations
	await db.delete(weeklyObjective).where(ne(weeklyObjective.weekStartDate, weekStartDate));
	
	// 1. Get all blocks
	const blocks = await db.select().from(block);
	
	// 2. Get objectives for this week
	let objectives = await db.select()
		.from(weeklyObjective)
		.where(eq(weeklyObjective.weekStartDate, weekStartDate));

	// If no objectives exist for this week (and we have blocks), create placeholders
	if (objectives.length === 0 && blocks.length > 0) {
		const newObjectives = [];
		for (const b of blocks) {
			// Create 2 empty objectives per block
			newObjectives.push(
				{ blockId: b.id, text: '', weekStartDate, isCompleted: false },
				{ blockId: b.id, text: '', weekStartDate, isCompleted: false }
			);
		}
		if (newObjectives.length > 0) {
			await db.insert(weeklyObjective).values(newObjectives);
			objectives = await db.select()
				.from(weeklyObjective)
				.where(eq(weeklyObjective.weekStartDate, weekStartDate));
		}
	}

	// 3. Get schedule allocations
	// Since allocations are now persistent, we just get all of them
	// We might want to filter by user if we had multiple users, but for now get all
	const allocations = await db.select().from(scheduleAllocation);

	return {
		blocks,
		objectives,
		allocations
	};
};

export const updateSchedule = async (
	weekStartDate: string,
	newAllocations: { blockId: number; dayOfWeek: number; hourSlot: number }[]
) => {
	return await db.transaction(async (tx) => {
		// Clear existing allocations (all of them, since they are persistent/global now)
		// Or if we want to support history later, we'd filter by week. 
		// But requirement says "persistent across weeks", implying one schedule for all weeks.
		// So we delete all and replace with new state.
		await tx.delete(scheduleAllocation);

		// Insert new allocations
		if (newAllocations.length > 0) {
			await tx.insert(scheduleAllocation).values(
				newAllocations.map(a => ({
					...a,
					weekStartDate // We still store this for reference, or maybe we should ignore it?
					// If we want it persistent, the weekStartDate in the DB might be misleading if it's from 3 weeks ago.
					// But for now let's just keep the schema as is and treat the table as "current schedule".
				}))
			);
		}
	});
};

export const updateObjective = async (id: number, updates: { text?: string; isCompleted?: boolean }) => {
	await db.update(weeklyObjective)
		.set(updates)
		.where(eq(weeklyObjective.id, id));
};

export const addObjective = async (blockId: number, weekStartDate: string) => {
	// Check count first
	const existing = await db.select()
		.from(weeklyObjective)
		.where(and(
			eq(weeklyObjective.blockId, blockId),
			eq(weeklyObjective.weekStartDate, weekStartDate)
		));
	
	if (existing.length >= 2) return;

	await db.insert(weeklyObjective).values({
		blockId,
		weekStartDate,
		text: '',
		isCompleted: false
	});
};

export const deleteObjective = async (id: number) => {
	await db.delete(weeklyObjective).where(eq(weeklyObjective.id, id));
};

export const updateUser = async (age: number, lifespan: number, weeklyAvailableTime?: number) => {
	// Update the first user found (single user app)
	// We use a subquery or just update all, but let's be safe and update where id exists
	// Since we don't have the ID passed in, and we know there's only one user...
	// Let's just update all rows, but ensure values are valid numbers
	if (isNaN(age) || isNaN(lifespan)) return;
	
	const updates: { age: number; lifespan: number; weeklyAvailableTime?: number } = { age, lifespan };
	if (weeklyAvailableTime !== undefined && !isNaN(weeklyAvailableTime)) {
		updates.weeklyAvailableTime = weeklyAvailableTime;
	}
	
	await db.update(user).set(updates);
};

export const updateBlock = async (id: number, updates: { name?: string; timeAllocation?: number }) => {
	await db.update(block)
		.set(updates)
		.where(eq(block.id, id));
};

export const fixBlockColors = async (colorMap: Record<string, string>) => {
	const blocks = await db.select().from(block);
	for (const b of blocks) {
		if (colorMap[b.name]) {
			await db.update(block)
				.set({ color: colorMap[b.name] })
				.where(eq(block.id, b.id));
		}
	}
};

export const getAllAffirmations = async () => {
	return await db.select().from(affirmation);
};

export const addAffirmation = async (text: string) => {
	await db.insert(affirmation).values({ text });
};

export const updateAffirmation = async (id: number, text: string) => {
	await db.update(affirmation)
		.set({ text })
		.where(eq(affirmation.id, id));
};

export const deleteAffirmation = async (id: number) => {
	await db.delete(affirmation).where(eq(affirmation.id, id));
};

