import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { updateSettingsSchema } from './settings.schema';
import { getSettings, updateSettings, resetSettings, getSystemInfo } from './settings.controller';

const router = Router();

router.get('/', authenticate, getSettings);
router.put('/', authenticate, authorize('Admin'), validate(updateSettingsSchema), updateSettings);
router.post('/reset', authenticate, authorize('Admin'), resetSettings);
router.get('/system', authenticate, getSystemInfo);

export default router;