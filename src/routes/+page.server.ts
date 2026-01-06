import {
	getDeathClock,
	updateUser,
	getObjectives,
	addObjective,
	deleteObjective,
	updateObjective,
	getRandomAffirmation,
	getAllAffirmations,
	getNecessityBlocks,
	getScheduleAllocations,
	updateSchedule,
	updateNecessityBlock,
	addNecessityBlock,
	deleteNecessityBlock,
	updatePurposeLabel,
	clearObjectivesByCategory,
	PURPOSE_COLOR
} from '$lib/server/db/actions';
import type { ObjectiveCategory } from '$lib/server/db/schema';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const deathClock = await getDeathClock();
	const objectives = await getObjectives();
	const necessityBlocks = await getNecessityBlocks();
	const allocations = await getScheduleAllocations();
	const affirmation = await getRandomAffirmation();
	const affirmations = await getAllAffirmations();

	return {
		deathClock,
		objectives,
		necessityBlocks,
		allocations,
		affirmation,
		affirmations,
		purposeColor: PURPOSE_COLOR
	};
};

export const actions: Actions = {
	updateSettings: async ({ request }) => {
		const data = await request.formData();
		const birthDate = String(data.get('birthDate'));
		const lifespan = Number(data.get('lifespan'));
		const purposeLabel = data.has('purposeLabel') ? String(data.get('purposeLabel')) : undefined;

		if (birthDate && !isNaN(lifespan)) {
			await updateUser(birthDate, lifespan, purposeLabel);
		}

		return { success: true };
	},

	updatePurposeLabel: async ({ request }) => {
		const data = await request.formData();
		const purposeLabel = String(data.get('purposeLabel') || '');
		await updatePurposeLabel(purposeLabel);
		return { success: true };
	},

	updateNecessityBlock: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const name = data.has('name') ? String(data.get('name')) : undefined;

		if (!isNaN(id) && name !== undefined) {
			await updateNecessityBlock(id, name);
		}
		return { success: true };
	},

	addNecessityBlock: async ({ request }) => {
		const data = await request.formData();
		const name = String(data.get('name') || 'New Block');
		const color = String(data.get('color') || '#6b7280');

		await addNecessityBlock(name, color);
		return { success: true };
	},

	deleteNecessityBlock: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));

		if (!isNaN(id)) {
			await deleteNecessityBlock(id);
		}
		return { success: true };
	},

	addObjective: async ({ request }) => {
		const data = await request.formData();
		const category = String(data.get('category')) as ObjectiveCategory;
		const text = data.has('text') ? String(data.get('text')) : '';

		if (category) {
			await addObjective(category, text);
		}
		return { success: true };
	},

	deleteObjective: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));

		if (!isNaN(id)) {
			await deleteObjective(id);
		}
		return { success: true };
	},

	updateObjective: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const text = data.has('text') ? String(data.get('text')) : undefined;
		const isCompleted = data.has('isCompleted') ? data.get('isCompleted') === 'true' : undefined;

		if (!isNaN(id)) {
			await updateObjective(id, { text, isCompleted });
		}
		return { success: true };
	},

	clearObjectives: async ({ request }) => {
		const data = await request.formData();
		const category = String(data.get('category')) as ObjectiveCategory;

		if (category) {
			await clearObjectivesByCategory(category);
		}
		return { success: true };
	},

	updateSchedule: async ({ request }) => {
		const data = await request.formData();
		const allocationsStr = String(data.get('allocations'));

		if (allocationsStr) {
			try {
				const allocations = JSON.parse(allocationsStr);
				await updateSchedule(allocations);
			} catch (e) {
				console.error('Failed to parse allocations', e);
			}
		}
		return { success: true };
	}
};
