import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authMiddleware, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware, authorizeRoles('admin'));

// Admin delete user (hard delete)
// DELETE /api/admin/auth/users/:id
router.delete('/users/:id', authController.adminDeleteUser);

export default router;
