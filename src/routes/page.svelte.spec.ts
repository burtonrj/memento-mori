import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	const mockData = {
		deathClock: {
			birthDate: '1990-01-01',
			lifespan: 80,
			purposeLabel: 'Test Purpose',
			hoursLeft: 350400
		},
		objectives: [],
		necessityBlocks: [
			{ id: 1, name: 'Work', color: '#3b82f6', sortOrder: 0 },
			{ id: 2, name: 'Chores', color: '#6b7280', sortOrder: 1 },
			{ id: 3, name: 'Relaxation', color: '#ec4899', sortOrder: 2 },
			{ id: 4, name: 'Study', color: '#06b6d4', sortOrder: 3 }
		],
		allocations: [],
		affirmation: 'Test affirmation',
		purposeColor: '#8b5cf6'
	};

	it('should render primary focus section', async () => {
		render(Page, { data: mockData });

		const heading = page.getByRole('heading', { level: 2 });
		await expect.element(heading).toBeInTheDocument();
	});
});
