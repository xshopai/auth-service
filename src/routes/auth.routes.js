import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authMiddleware, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Local login
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Password operations
router.post('/password/forgot', authController.forgotPassword);
router.post('/password/reset', authController.resetPassword);
router.post('/password/change', authMiddleware, authController.changePassword);

// Admin password operations
router.post('/admin/password/reset', authMiddleware, authorizeRoles('admin'), authController.adminResetPassword);

// Email operations
router.get('/email/verify', authController.verifyEmail);
router.post('/email/resend', authController.resendVerificationEmail);

// Token verification
router.get('/verify', authMiddleware, authController.verify);
router.get('/me', authMiddleware, authorizeRoles('customer', 'admin'), authController.me);

// JWT configuration endpoint for BFF
router.get('/config/jwt', async (req, res, next) => {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }
    res.json({
      secret: jwtSecret,
      algorithm: 'HS256',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/register', authController.register);
router.route('/reactivate').post(authController.requestAccountReactivation).get(authController.reactivateAccount);
router.delete('/account', authMiddleware, authController.deleteAccount);

export default router;
