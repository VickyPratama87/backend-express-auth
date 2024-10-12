import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from './asyncHandler.js';

// PROTECTED MIDDLEWARE
export const protectedMiddleware = asyncHandler(async (req, res, next) => {
	let token;

	token = req.cookies.jwt;

	if (token) {
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			req.user = await User.findById(decoded.id).select('-password');
			next();
		} catch (error) {
			res.status(401);
			throw new Error('Not authorized, token failed');
		}
	} else {
		res.status(401);
		throw new Error('Not authorized, no token');
	}
});

// ADMIN MIDDLEWARE
export const adminMiddleware = asyncHandler(async (req, res, next) => {
	if (req.user && req.user.role === 'admin') {
		next();
	} else {
		res.status(401);
		throw new Error('Not authorized as an admin');
	}
});

// VERIFICATION MIDDLEWARE
export const verificationMiddleware = asyncHandler(async (req, res, next) => {
	if (req.user && req.user.isVerified && req.user.EmailVerifiedAt) {
		res.status(200).json({
			message: 'User is verified',
		});
		next();
	} else {
		res.status(401);
		throw new Error('Unauthorized, please verify your email first');
	}
});
