import { Router } from 'express';
import {
  getCsrfToken,
  getCurrentUser,
  getSetupStatus,
  login,
  logout,
  setupInitialAdmin,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/csrf', getCsrfToken);
router.get('/setup-status', getSetupStatus);
router.post('/setup', setupInitialAdmin);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, getCurrentUser);

export default router;
