import { getAllAffirmations, addAffirmation, updateAffirmation, deleteAffirmation } from '$lib/server/db/actions';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const affirmations = await getAllAffirmations();
	return {
		affirmations
	};
};

export const actions: Actions = {
	add: async ({ request }) => {
		const data = await request.formData();
		const text = String(data.get('text'));
		
		if (text) {
			await addAffirmation(text);
		}
	},
	update: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const text = String(data.get('text'));
		
		if (!isNaN(id) && text) {
			await updateAffirmation(id, text);
		}
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		
		if (!isNaN(id)) {
			await deleteAffirmation(id);
		}
	}
};
