import { seedDatabase } from '$lib/server/db/seed';
import { verifySessionToken } from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';

console.log('Initializing server...');
seedDatabase().catch((err) => {
	console.error('Failed to seed database during startup:', err);
});

export const handle: Handle = async ({ event, resolve }) => {
	const session = event.cookies.get('session');
	const isLoginPage = event.url.pathname === '/login';

	// Verify token
	if (session && verifySessionToken(session)) {
		event.locals.user = { role: 'admin' };
	}

	// Protect all routes except login
	if (!event.locals.user && !isLoginPage) {
		throw redirect(303, '/login');
	}

	// If logged in and trying to access login, redirect to home
	if (event.locals.user && isLoginPage) {
		throw redirect(303, '/');
	}

	return resolve(event);
};
