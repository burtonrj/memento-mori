import { db } from './index';
import { user, affirmation, necessityBlock, objective } from './schema';
import type { ObjectiveCategory } from './schema';
import { count } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Define types for the JSON data
interface DefaultData {
	affirmations: string[];
	age: number;
	purposeLabel: string;
	necessityBlocks: { name: string; color: string }[];
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
		const dataPath = path.resolve('static/default-data.json');
		const fileContent = fs.readFileSync(dataPath, 'utf-8');
		const data: DefaultData = JSON.parse(fileContent);

		// 1. Create User
		const birthYear = new Date().getFullYear() - data.age;
		const [newUser] = await db.insert(user).values({
			birthDate: `${birthYear}-01-01`,
			lifespan: 80,
			purposeLabel: data.purposeLabel || ''
		}).returning();

		// 2. Create Affirmations
		if (data.affirmations.length > 0) {
			await db.insert(affirmation).values(
				data.affirmations.map(text => ({ text }))
			);
		}

		// 3. Create Necessity Blocks (exactly 4)
		for (let i = 0; i < data.necessityBlocks.length; i++) {
			const blockData = data.necessityBlocks[i];
			await db.insert(necessityBlock).values({
				name: blockData.name,
				color: blockData.color,
				sortOrder: i,
				userId: newUser.id
			});
		}

		// 4. Create initial objectives
		const categories: ObjectiveCategory[] = ['long-term-purpose', 'weekly-purpose', 'weekly-necessity'];
		for (const category of categories) {
			const objectives = data.objectives[category];
			if (objectives && objectives.length > 0) {
				await db.insert(objective).values(
					objectives.map((text, index) => ({
						category,
						text,
						isCompleted: false,
						sortOrder: index
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
