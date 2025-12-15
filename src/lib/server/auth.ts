import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

export const verifyPassword = (password: string) => {
	const hash = env.ADMIN_PASSWORD_HASH;
	if (!hash) {
		console.error('ADMIN_PASSWORD_HASH not set in environment variables');
		throw error(500, 'ADMIN_PASSWORD_HASH not set');
	}
	const isValid = bcrypt.compareSync(password, hash);
	console.log(`Verifying password. Hash exists: yes. Valid: ${isValid}`);
	return isValid;
};

export const createSessionToken = () => {
	const secret = env.AUTH_SECRET;
	if (!secret) throw error(500, 'AUTH_SECRET not set');
	// Token valid for 7 days
	return jwt.sign({ role: 'admin' }, secret, { expiresIn: '7d' });
};

export const verifySessionToken = (token: string) => {
	const secret = env.AUTH_SECRET;
	if (!secret) return false;
	try {
		jwt.verify(token, secret);
		return true;
	} catch {
		return false;
	}
};
