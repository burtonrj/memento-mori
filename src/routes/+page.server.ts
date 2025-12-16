import { getDeathClock, updateUser, getWeeklyData, addObjective, deleteObjective, updateObjective, getRandomAffirmation } from '$lib/server/db/actions';
import type { PageServerLoad, Actions } from './$types';

function getStartOfWeek() {
	const d = new Date();
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1);
	const monday = new Date(d.setDate(diff));
	return monday.toISOString().split('T')[0];
}

export const load: PageServerLoad = async () => {
	const deathClock = await getDeathClock();
	const weekStartDate = getStartOfWeek();
	const weeklyData = await getWeeklyData(weekStartDate);
	const affirmation = await getRandomAffirmation();
	
	return {
		deathClock,
		...weeklyData,
		weekStartDate,
		affirmation
	};
};

export const actions: Actions = {
	updateSettings: async ({ request }) => {
		const data = await request.formData();
		const birthDate = String(data.get('birthDate'));
		const lifespan = Number(data.get('lifespan'));
		const weeklyAvailableTime = data.has('weeklyAvailableTime') ? Number(data.get('weeklyAvailableTime')) : undefined;

		if (birthDate && !isNaN(lifespan)) {
			await updateUser(birthDate, lifespan, weeklyAvailableTime);
		}

		return { success: true };
	},
	updateBlock: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const name = data.has('name') ? String(data.get('name')) : undefined;
		const timeAllocation = data.has('timeAllocation') ? Number(data.get('timeAllocation')) : undefined;
		
		if (!isNaN(id)) {
			const { updateBlock } = await import('$lib/server/db/actions');
			await updateBlock(id, { name, timeAllocation });
		}
	},
	addObjective: async ({ request }) => {
		const data = await request.formData();
		const blockId = Number(data.get('blockId'));
		const weekStartDate = String(data.get('weekStartDate'));
		
		if (!isNaN(blockId) && weekStartDate) {
			await addObjective(blockId, weekStartDate);
		}
	},
	deleteObjective: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		
		if (!isNaN(id)) {
			await deleteObjective(id);
		}
	},
	updateObjective: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const text = data.has('text') ? String(data.get('text')) : undefined;
		const isCompleted = data.has('isCompleted') ? data.get('isCompleted') === 'true' : undefined;
		
		if (!isNaN(id)) {
			await updateObjective(id, { text, isCompleted });
		}
	},
	updateSchedule: async ({ request }) => {
		const data = await request.formData();
		const weekStartDate = String(data.get('weekStartDate'));
		const allocationsStr = String(data.get('allocations'));
		
		if (weekStartDate && allocationsStr) {
			try {
				const allocations = JSON.parse(allocationsStr);
				const { updateSchedule } = await import('$lib/server/db/actions');
				await updateSchedule(weekStartDate, allocations);
			} catch (e) {
				console.error('Failed to parse allocations', e);
			}
		}
	},
	fixColors: async () => {
		try {
			const { fixBlockColors } = await import('$lib/server/db/actions');
			const fs = await import('fs');
			const path = await import('path');
			
			const dataPath = path.resolve('static/default-data.json');
			const fileContent = fs.readFileSync(dataPath, 'utf-8');
			const data = JSON.parse(fileContent);
			
			const colorMap: Record<string, string> = {};
			for (const b of data.blocks) {
				colorMap[b.name] = b.color;
			}
			
			await fixBlockColors(colorMap);
			return { success: true };
		} catch (e) {
			console.error('Failed to fix colors', e);
			return { success: false };
		}
	}
};
