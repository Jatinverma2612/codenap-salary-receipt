import { Router } from 'express';
import {
  createReceipt,
  deleteReceipt,
  getReceiptById,
  listReceipts,
  updateReceipt,
} from '../controllers/receiptController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { validateObjectId } from '../middleware/validateMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', listReceipts);
router.get('/:id', validateObjectId('id'), getReceiptById);
router.post('/', requireRole('admin', 'hr'), createReceipt);
router.put('/:id', validateObjectId('id'), requireRole('admin', 'hr'), updateReceipt);
router.patch('/:id', validateObjectId('id'), requireRole('admin', 'hr'), updateReceipt);
router.delete('/:id', validateObjectId('id'), requireRole('admin', 'hr'), deleteReceipt);

export default router;
