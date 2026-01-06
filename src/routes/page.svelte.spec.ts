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
			purposeBricks: 0,
			hoursLeft: 350400
		},
		objectives: [],
		necessityBlocks: [
			{ id: 1, name: 'Work', color: '#3b82f6', sortOrder: 0, userId: 1 },
			{ id: 2, name: 'Chores', color: '#6b7280', sortOrder: 1, userId: 1 },
			{ id: 3, name: 'Relaxation', color: '#ec4899', sortOrder: 2, userId: 1 },
			{ id: 4, name: 'Study', color: '#06b6d4', sortOrder: 3, userId: 1 }
		],
		allocations: [],
		affirmation: 'Test affirmation',
		affirmations: [
			{ id: 1, text: 'Test affirmation' },
			{ id: 2, text: 'Another affirmation' }
		],
		purposeColor: '#8b5cf6'
	};

	it('should render primary focus section', async () => {
		render(Page, { data: mockData });

		const heading = page.getByRole('heading', { level: 2 });
		await expect.element(heading).toBeInTheDocument();
	});
});
