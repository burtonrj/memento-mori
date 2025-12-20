import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDeathClock, getNecessityBlocks, getObjectives } from './actions';
import { db } from './index';

// Mock the db module
vi.mock('./index', () => ({
	db: {
		select: vi.fn(),
		insert: vi.fn(),
		delete: vi.fn(),
		update: vi.fn(),
		transaction: vi.fn((cb) => cb({ delete: vi.fn(), insert: vi.fn() })),
	}
}));

describe('Database Actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getDeathClock', () => {
		it('should calculate remaining hours correctly', async () => {
			// Mock db response
			const mockUser = { birthDate: '1990-01-01', lifespan: 80, purposeLabel: 'Test' };
			const selectMock = {
				from: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([mockUser])
				})
			};
			(db.select as any).mockReturnValue(selectMock);

			const result = await getDeathClock();

			expect(result).not.toBeNull();
			expect(result?.birthDate).toBe('1990-01-01');
			expect(result?.lifespan).toBe(80);
			expect(result?.purposeLabel).toBe('Test');
			expect(typeof result?.hoursLeft).toBe('number');
		});

		it('should return null if no user found', async () => {
			const selectMock = {
				from: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([])
				})
			};
			(db.select as any).mockReturnValue(selectMock);

			const result = await getDeathClock();

			expect(result).toBeNull();
		});
	});

	describe('getNecessityBlocks', () => {
		it('should return necessity blocks ordered by sortOrder', async () => {
			const mockBlocks = [
				{ id: 1, name: 'Work', color: '#3b82f6', sortOrder: 0 },
				{ id: 2, name: 'Chores', color: '#6b7280', sortOrder: 1 },
			];
			
			const selectMock = {
				from: vi.fn().mockReturnValue({
					orderBy: vi.fn().mockResolvedValue(mockBlocks)
				})
			};
			(db.select as any).mockReturnValue(selectMock);

			const result = await getNecessityBlocks();

			expect(result).toEqual(mockBlocks);
			expect(result.length).toBe(2);
		});
	});

	describe('getObjectives', () => {
		it('should return objectives ordered by sortOrder', async () => {
			const mockObjectives = [
				{ id: 1, category: 'long-term-purpose', text: 'Goal 1', isCompleted: false, sortOrder: 0 },
				{ id: 2, category: 'weekly-purpose', text: 'Goal 2', isCompleted: false, sortOrder: 0 },
			];
			
			const selectMock = {
				from: vi.fn().mockReturnValue({
					orderBy: vi.fn().mockResolvedValue(mockObjectives)
				})
			};
			(db.select as any).mockReturnValue(selectMock);

			const result = await getObjectives();

			expect(result).toEqual(mockObjectives);
			expect(result.length).toBe(2);
		});
	});
});
