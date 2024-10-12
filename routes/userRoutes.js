import express from 'express';
import { protectedMiddleware, adminMiddleware, verificationMiddleware } from '../middleware/authMiddleware.js';
import { allUser } from '../controllers/userController.js';

const router = express.Router();
const baseUrl = '/api/v1/user';

router.get(`${baseUrl}/`, protectedMiddleware, adminMiddleware, allUser);
router.get(`${baseUrl}/verification`, protectedMiddleware, verificationMiddleware);

export default router;
