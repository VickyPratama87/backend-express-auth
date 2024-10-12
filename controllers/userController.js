import User from '../models/User.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const allUser = asyncHandler(async (req, res) => {
	const users = await User.find();

	res.status(200).json({
		message: 'All users',
		data: users,
	});
});
