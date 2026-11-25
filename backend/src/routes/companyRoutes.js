import { Router } from 'express';
import {
  getCompanyLogo,
  getCompanySettings,
  getReceiptLogo,
  resetCompanyLogo,
  resetReceiptLogo,
  updateCompanySettings,
  uploadCompanyLogo,
  uploadReceiptLogo,
} from '../controllers/companyController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { uploadLogoSingle } from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', getCompanySettings);
router.put('/', requireRole('admin', 'hr'), updateCompanySettings);
router.patch('/', requireRole('admin', 'hr'), updateCompanySettings);

router.get('/logo', getCompanyLogo);
router.post('/logo', requireRole('admin', 'hr'), uploadLogoSingle, uploadCompanyLogo);
router.put('/logo', requireRole('admin', 'hr'), uploadLogoSingle, uploadCompanyLogo);
router.patch('/logo', requireRole('admin', 'hr'), uploadLogoSingle, uploadCompanyLogo);
router.delete('/logo', requireRole('admin', 'hr'), resetCompanyLogo);

router.get('/receipt-logo', getReceiptLogo);
router.post('/receipt-logo', requireRole('admin', 'hr'), uploadLogoSingle, uploadReceiptLogo);
router.put('/receipt-logo', requireRole('admin', 'hr'), uploadLogoSingle, uploadReceiptLogo);
router.patch('/receipt-logo', requireRole('admin', 'hr'), uploadLogoSingle, uploadReceiptLogo);
router.delete('/receipt-logo', requireRole('admin', 'hr'), resetReceiptLogo);

export default router;
