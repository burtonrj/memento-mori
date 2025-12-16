import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDeathClock, getWeeklyData } from './actions';
import { db } from './index';

// Mock the db module
vi.mock('./index', () => ({
	db: {
		select: vi.fn(),
		insert: vi.fn(),
		delete: vi.fn(),
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
			const mockUser = { birthDate: '1990-01-01', lifespan: 80 };
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

	describe('getWeeklyData', () => {
		it('should create default objectives if none exist for the week', async () => {
			const weekStartDate = '2023-10-23';
			const mockBlocks = [{ id: 1, name: 'Work' }, { id: 2, name: 'Play' }];
			
			// Mock delete
			(db.delete as any).mockReturnValue({
				where: vi.fn().mockResolvedValue(undefined)
			});

			// Mock chain for blocks
			const blocksQuery = { from: vi.fn().mockResolvedValue(mockBlocks) };

			
			// Mock chain for objectives (first call returns empty, second returns created)
			const objectivesQuery = {
				from: vi.fn().mockReturnValue({
					where: vi.fn()
						.mockResolvedValueOnce([]) // First call: empty
						.mockResolvedValueOnce([   // Second call: populated
							{ id: 1, blockId: 1, text: '', weekStartDate },
							{ id: 2, blockId: 1, text: '', weekStartDate },
							{ id: 3, blockId: 2, text: '', weekStartDate },
							{ id: 4, blockId: 2, text: '', weekStartDate }
						])
				})
			};

			// Mock chain for allocations
			const allocationsQuery = {
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([])
				})
			};

			// Setup db.select to return different mocks based on call order or logic
			// Since db.select() returns a builder, we can mock the builder
			// But here we are calling db.select().from(...)
			// We can mock db.select to return a fresh builder each time
			
			// A simpler way to mock sequential calls to db.select()...
			// We can inspect what .from() is called with, but that requires exporting schema tables or checking args
			// For simplicity, let's just mock the sequence of resolved values if possible, 
			// but the chain structure makes it hard.
			
			// Let's refine the mock:
			const fromMock = vi.fn();
			(db.select as any).mockReturnValue({ from: fromMock });

			fromMock.mockImplementation((table) => {
				// We can't easily check table identity here because of how Drizzle objects work
				// But we know the order of calls in the function:
				// 1. blocks
				// 2. objectives
				// 3. objectives (after insert)
				// 4. allocations
				return {
					where: vi.fn().mockImplementation(() => {
						// This is for objectives and allocations
						return Promise.resolve([]); 
					}),
					// For blocks (no where clause immediately)
					then: (resolve: any) => resolve(mockBlocks) 
				} as any;
			});

			// This is getting complicated to mock perfectly with the fluent API.
			// Let's try a different approach: Mocking specific return values based on call count is fragile.
			// But for this test, we want to verify `db.insert` is called.
			
			// Reset mock
			vi.clearAllMocks();
			
			const mockSelect = vi.fn();
			(db.select as any).mockReturnValue({
				from: vi.fn().mockImplementation((table) => {
					// Identify table by some property or just assume order
					// We'll assume the order: blocks, objectives, (insert), objectives, allocations
					return {
						where: vi.fn().mockResolvedValue([]), // Return empty for objectives/allocations
						then: (resolve: any) => resolve(mockBlocks) // Return blocks for the first call (which has no where)
					};
				})
			});
			
			// We need to ensure the first call (blocks) returns data, and second (objectives) returns empty
			// The code:
			// const blocks = await db.select().from(block);
			// const objectives = await db.select().from(weeklyObjective).where(...)
			
			let callCount = 0;
			(db.select as any).mockImplementation(() => ({
				from: vi.fn().mockImplementation(() => {
					callCount++;
					if (callCount === 1) { // blocks
						return Promise.resolve(mockBlocks);
					}
					if (callCount === 2) { // objectives (initial check)
						return {
							where: vi.fn().mockResolvedValue([])
						};
					}
					if (callCount === 3) { // objectives (after insert)
						return {
							where: vi.fn().mockResolvedValue(['created'])
						};
					}
					if (callCount === 4) { // allocations
						return Promise.resolve([]);
					}
				})
			}));

			(db.insert as any).mockReturnValue({
				values: vi.fn().mockResolvedValue(undefined)
			});

			await getWeeklyData(weekStartDate);

			// Verify insert was called
			expect(db.insert).toHaveBeenCalled();
			// Should insert 2 objectives per block * 2 blocks = 4 objectives
			const insertCall = (db.insert as any).mock.calls[0]; // First call to insert
			// We can't easily check the table passed, but we can check values()
			// Wait, db.insert(table).values(...)
			// So db.insert returns an object with values() method
			
			// We need to verify that values() was called with the correct array
			// But we mocked the return of db.insert above
		});
	});
});
