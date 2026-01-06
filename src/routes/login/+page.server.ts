import { fail, redirect } from '@sveltejs/kit';
import { verifyPassword, createSessionToken } from '$lib/server/auth';
import { dev } from '$app/environment';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// If already logged in, go home
	if (locals.user) throw redirect(302, '/');
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const password = data.get('password') as string;

		console.log('Attempting login...');
		if (!verifyPassword(password)) {
			console.log('Password verification failed');
			return fail(400, { error: 'Incorrect password' });
		}

		console.log('Password verified, creating session...');
		const token = createSessionToken();

		cookies.set('session', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax', // Changed from strict to lax to ensure it works on first navigation
			secure: !dev, // Use SvelteKit's dev flag
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		throw redirect(302, '/');
	}
};
