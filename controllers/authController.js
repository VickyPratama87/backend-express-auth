import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/sendEmail.js';
import Otpcode from '../models/Otpcode.js';

const signToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: '1d',
	});
};

const generateRefreshToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_TOKEN_REFRESH, {
		expiresIn: '7d',
	});
};

const createResToken = async (user, statusCode, res) => {
	const accessToken = signToken(user._id);
	const refreshToken = generateRefreshToken(user._id);

	await User.findByIdAndUpdate(user._id, {
		refreshToken: refreshToken,
	});

	const cookieOptionToken = {
		expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
		httpOnly: true,
		security: false,
	};

	const cookieOptionRefreshToken = {
		expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		httpOnly: true,
		security: false,
	};

	res.cookie('jwt', accessToken, cookieOptionToken);
	res.cookie('jwt_refresh', refreshToken, cookieOptionRefreshToken);

	user.password = undefined;

	res.status(statusCode).json({
		user,
	});
};

// REGISTER USER
export const registerUser = asyncHandler(async (req, res) => {
	const isFirstUser = (await User.countDocuments()) === 0 ? 'admin' : 'user';

	const user = await User.create({
		...req.body,
		role: isFirstUser,
	});

	const otpData = await user.generateOtpCode();

	await sendEmail({
		to: user.email,
		subject: 'Email Verification',
		html: `
			<!DOCTYPE html>
			<html lang="id">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Email Verifikasi</title>
				<style>
					body {
							font-family: Arial, sans-serif;
							background-color: #f4f4f4;
							margin: 0;
							padding: 0;
					}
					.email-container {
							max-width: 600px;
							margin: 40px auto;
							background-color: #ffffff;
							border-radius: 10px;
							box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
							padding: 20px;
					}
					h1 {
							font-size: 24px;
							color: #333;
							text-align: center;
					}
					p {
							font-size: 16px;
							color: #555;
							line-height: 1.5;
					}
					.otp-code {
							text-align: center;
							background-color: #ffeb3b;
							font-weight: bold;
							font-size: 36px;
							padding: 10px;
							margin: 20px 0;
							border-radius: 5px;
							color: #333;
							letter-spacing: 5px;
					}
					.footer {
							font-size: 12px;
							color: #999;
							text-align: center;
							margin-top: 20px;
					}
				</style>
			</head>
			<body>
				<div class="email-container">
					<h1>Selamat, ${user.name}! Kamu Berhasil Terdaftar</h1>
					<p>Terima kasih telah mendaftar. Silakan gunakan kode OTP di bawah ini untuk verifikasi akun kamu. Kode ini berlaku selama 5 menit.</p>
					<div class="otp-code">${otpData.otp}</div>
					<p>Jika kamu tidak melakukan pendaftaran ini, silakan abaikan email ini.</p>
					<div class="footer">© 2024 Vicode - Codecit. Semua Hak Dilindungi.</div>
				</div>
			</body>
			</html>
		`,
	});

	createResToken(user, 201, res);
});

// GENERATE OTP CODE
export const generateOtpCodeUser = asyncHandler(async (req, res) => {
	const currentUser = await User.findById(req.user._id);

	const otpData = await currentUser.generateOtpCode();

	await sendEmail({
		to: currentUser.email,
		subject: 'Successfully Generate OTP Code',
		html: `
			<!DOCTYPE html>
			<html lang="id">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Generate OTP Code</title>
				<style>
					body {
							font-family: Arial, sans-serif;
							background-color: #f7f7f7;
							margin: 0;
							padding: 0;
					}
					.container {
							max-width: 600px;
							margin: 40px auto;
							background-color: #fff;
							border-radius: 10px;
							box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
							padding: 20px;
					}
					h1 {
							font-size: 24px;
							color: #333;
							text-align: center;
							margin-bottom: 20px;
					}
					p {
							font-size: 16px;
							color: #555;
							text-align: center;
							line-height: 1.6;
					}
					.otp-code {
							display: block;
							background-color: #ffe100;
							font-size: 40px;
							font-weight: bold;
							color: #333;
							text-align: center;
							padding: 15px;
							margin: 20px auto;
							border-radius: 8px;
							letter-spacing: 8px;
							width: 80%;
					}
					.validity {
							font-size: 14px;
							color: #999;
							text-align: center;
							margin-top: 10px;
					}
					.footer {
							font-size: 12px;
							color: #888;
							text-align: center;
							margin-top: 20px;
					}
				</style>
			</head>
			<body>
				<div class="container">
					<h1>Generate OTP Code Berhasil, ${currentUser.name}!</h1>
					<p>Gunakan kode OTP di bawah ini untuk verifikasi akun Anda. Kode ini akan berlaku selama 5 menit.</p>
					<div class="otp-code">${otpData.otp}</div>
					<p class="validity">Valid Until: 5 menit</p>
					<div class="footer">Jika Anda tidak melakukan permintaan ini, silakan abaikan email ini.</div>
				</div>
			</body>
			</html>
		`,
	});

	res.status(200).json({
		message: 'Generate OTP Code Successfully, check your email',
	});
});

// VERIFICATION USER
export const verificationUser = asyncHandler(async (req, res) => {
	// Check if otp empty
	if (!req.body.otp) {
		res.status(400);
		throw new Error('OTP Code is required');
	}

	// Check if otp not found
	const otp_code = await Otpcode.findOne({ otp: req.body.otp, user: req.user._id });
	if (!otp_code) {
		res.status(400);
		throw new Error('Invalid OTP Code');
	}

	// Update isVerified and EmailVerifiedAt
	const userData = await User.findById(req.user._id);

	await User.findByIdAndUpdate(userData._id, {
		isVerified: true,
		EmailVerifiedAt: Date.now(),
	});

	return res.status(200).json({
		message: 'Account Verification Successfully',
	});
});

// LOGIN USER
export const loginUser = asyncHandler(async (req, res) => {
	// Check if email and password empty
	if (!req.body.email && !req.body.password) {
		res.status(400);
		throw new Error('Email and password are required');
	}

	// Check if email is false
	const userData = await User.findOne({
		email: req.body.email,
	});

	if (userData && (await userData.matchPassword(req.body.password))) {
		createResToken(userData, 200, res);
	} else {
		res.status(400);
		throw new Error('Invalid email or password');
	}
});

// GET USER PROFILE
export const getUser = asyncHandler(async (req, res) => {
	const user = await User.findById(req.user.id).select('-password');
	if (user) {
		res.status(200).json({
			user,
		});
	} else {
		res.status(404);
		throw new Error('User not found');
	}
});

// LOGOUT USER
export const logoutUser = async (req, res) => {
	res.cookie('jwt', '', {
		httpOnly: true,
		expire: new Date(Date.now()),
	});

	await User.findByIdAndUpdate(req.user._id, {
		refreshToken: null,
	});

	res.cookie('jwt_refresh', '', {
		httpOnly: true,
		expire: new Date(Date.now()),
	});

	res.status(200).json({
		message: 'Logout Successfully',
	});
};

// REFRESH TOKEN
export const refreshTokenUser = asyncHandler(async (req, res) => {
	const refreshToken = req.cookies.jwt_refresh;
	if (!refreshToken) {
		res.status(401);
		throw new Error('Unauthorized, no refresh token');
	}

	const user = await User.findOne({ refreshToken });
	if (!user) {
		res.status(401);
		throw new Error('Unauthorized, invalid user token');
	}

	jwt.verify(refreshToken, process.env.JWT_TOKEN_REFRESH, (err) => {
		if (err) {
			res.status(401);
			throw new Error('Invalid Refresh Token');
		}

		createResToken(user, 200, res);
	});
});
