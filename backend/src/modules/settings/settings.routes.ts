import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission, Permissions } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { updateSettingsSchema } from './settings.schema';
import { getSettings, updateSettings, resetSettings, getSystemInfo, uploadLogoHandler } from './settings.controller';

const router = Router();

router.get('/', authenticate, getSettings);
router.put('/', authenticate, requirePermission(Permissions.SETTINGS_UPDATE), validate(updateSettingsSchema), updateSettings);
router.post('/reset', authenticate, requirePermission(Permissions.SETTINGS_UPDATE), resetSettings);
router.get('/system', authenticate, getSystemInfo);
router.post('/logo', authenticate, requirePermission(Permissions.SETTINGS_UPDATE), uploadLogoHandler);

export default router;
