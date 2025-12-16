import { db } from './index';
import { user, affirmation, block, weeklyObjective } from './schema';
import { count } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Define types for the JSON data
interface DefaultData {
	affirmations: string[];
	blocks: { name: string; color: string }[];
	age: number;
	availableTime: number;
	timeAllocation: number[];
	objectives: Record<string, string[]>;
}

export async function seedDatabase() {
	try {
		// Check if user table is empty
		const userCount = await db.select({ count: count() }).from(user);
		
		if (userCount[0].count > 0) {
			console.log('Database already seeded.');
			return;
		}

		console.log('Seeding database...');

		// Read default data
		// In a production environment, you might need to adjust the path resolution
		const dataPath = path.resolve('static/default-data.json');
		const fileContent = fs.readFileSync(dataPath, 'utf-8');
		const data: DefaultData = JSON.parse(fileContent);

		// 1. Create User
		const birthYear = new Date().getFullYear() - data.age;
		const [newUser] = await db.insert(user).values({
			birthDate: `${birthYear}-01-01`,
			lifespan: 80
		}).returning();

		// 2. Create Affirmations
		if (data.affirmations.length > 0) {
			await db.insert(affirmation).values(
				data.affirmations.map(text => ({ text }))
			);
		}

		// 3. Create Blocks and Objectives
		// We need to calculate the current week start date for the initial objectives
		const today = new Date();
		const day = today.getDay(); // 0 is Sunday
		const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
		const monday = new Date(today.setDate(diff));
		const weekStartDate = monday.toISOString().split('T')[0];

		for (let i = 0; i < data.blocks.length; i++) {
			const blockData = data.blocks[i];
			const [newBlock] = await db.insert(block).values({
				name: blockData.name,
				color: blockData.color,
				timeAllocation: data.timeAllocation[i],
				userId: newUser.id
			}).returning();

			// Add objectives for this block
			const objectives = data.objectives[blockData.name];
			if (objectives && objectives.length > 0) {
				await db.insert(weeklyObjective).values(
					objectives.map(text => ({
						blockId: newBlock.id,
						text,
						weekStartDate,
						isCompleted: false
					}))
				);
			}
		}

		console.log('Database seeding completed successfully.');

	} catch (error) {
		console.error('Error seeding database:', error);
		throw error;
	}
}
