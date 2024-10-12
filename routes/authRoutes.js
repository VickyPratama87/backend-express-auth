import express from 'express';
import { registerUser, loginUser, logoutUser, getUser, generateOtpCodeUser, verificationUser, refreshTokenUser } from '../controllers/authController.js';
import { protectedMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
const baseUrl = '/api/v1/auth';

router.post(`${baseUrl}/login`, loginUser);
router.post(`${baseUrl}/register`, registerUser);
router.post(`${baseUrl}/logout`, protectedMiddleware, logoutUser);
router.get(`${baseUrl}/getuser`, protectedMiddleware, getUser);
router.post(`${baseUrl}/generate-otp-code`, protectedMiddleware, generateOtpCodeUser);
router.post(`${baseUrl}/verification-user`, protectedMiddleware, verificationUser);
router.post(`${baseUrl}/refresh-token`, protectedMiddleware, refreshTokenUser);

export default router;
