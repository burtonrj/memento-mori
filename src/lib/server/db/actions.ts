import { db } from './index';
import { user, affirmation, necessityBlock, objective, scheduleAllocation } from './schema';
import type { ObjectiveCategory } from './schema';
import { eq, and, sql } from 'drizzle-orm';

// Maximum objectives per category
const OBJECTIVE_LIMITS: Record<ObjectiveCategory, number> = {
	'long-term-purpose': 3,
	'weekly-purpose': 3,
	'weekly-necessity': 2
};

// Primary Focus block color (constant)
export const PURPOSE_COLOR = '#8b5cf6'; // Purple for primary focus

export const getDeathClock = async () => {
	const userData = await db.select().from(user).limit(1);
	if (!userData.length) return null;

	const { birthDate, lifespan, purposeLabel, purposeBricks } = userData[0];
	
	const birth = new Date(birthDate);
	const death = new Date(birth);
	death.setFullYear(birth.getFullYear() + lifespan);
	const now = new Date();
	const msLeft = death.getTime() - now.getTime();
	const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));

	return {
		birthDate,
		lifespan,
		purposeLabel,
		purposeBricks,
		hoursLeft
	};
};

export const getRandomAffirmation = async () => {
	const result = await db.select().from(affirmation).orderBy(sql`RANDOM()`).limit(1);
	return result[0]?.text || "Memento Mori";
};

export const getNecessityBlocks = async () => {
	return await db.select().from(necessityBlock).orderBy(necessityBlock.sortOrder);
};

export const getObjectives = async () => {
	return await db.select().from(objective).orderBy(objective.sortOrder);
};

export const getScheduleAllocations = async () => {
	return await db.select().from(scheduleAllocation);
};

export const updateSchedule = async (
	newAllocations: { blockType: string; necessityBlockId: number | null; dayOfWeek: number; hourSlot: number }[]
) => {
	return await db.transaction(async (tx) => {
		await tx.delete(scheduleAllocation);

		if (newAllocations.length > 0) {
			await tx.insert(scheduleAllocation).values(newAllocations);
		}
	});
};

export const updateObjective = async (id: number, updates: { text?: string; isCompleted?: boolean }) => {
	await db.update(objective)
		.set(updates)
		.where(eq(objective.id, id));
};

export const addObjective = async (category: ObjectiveCategory, text: string = '') => {
	// Check count first
	const existing = await db.select()
		.from(objective)
		.where(eq(objective.category, category));
	
	const limit = OBJECTIVE_LIMITS[category];
	if (existing.length >= limit) return null;

	const result = await db.insert(objective).values({
		category,
		text,
		isCompleted: false,
		sortOrder: existing.length
	}).returning();
	
	return result[0];
};

export const deleteObjective = async (id: number) => {
	await db.delete(objective).where(eq(objective.id, id));
};

export const clearObjectivesByCategory = async (category: ObjectiveCategory) => {
	// Delete all objectives in this category
	await db.delete(objective).where(eq(objective.category, category));
};

export const updateUser = async (birthDate: string, lifespan: number, purposeLabel?: string) => {
	if (!birthDate || isNaN(lifespan)) return;
	
	const updates: { birthDate: string; lifespan: number; purposeLabel?: string } = { birthDate, lifespan };
	if (purposeLabel !== undefined) {
		updates.purposeLabel = purposeLabel;
	}
	
	await db.update(user).set(updates);
};

export const updatePurposeLabel = async (purposeLabel: string) => {
	await db.update(user).set({ purposeLabel });
};

export const updateNecessityBlock = async (id: number, name: string) => {
	await db.update(necessityBlock)
		.set({ name })
		.where(eq(necessityBlock.id, id));
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

