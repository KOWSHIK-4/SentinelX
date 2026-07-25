import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission, Permissions } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { createAssetSchema, updateAssetSchema, assetQuerySchema } from './asset.schema';
import {
  createAsset,
  getAssets,
  getAsset,
  updateAsset,
  deleteAsset,
  getAssetStats,
} from './asset.controller';

const router = Router();

router.get('/stats', authenticate, getAssetStats);

router.get('/', authenticate, validate(assetQuerySchema, 'query'), requirePermission(Permissions.ASSETS_READ), getAssets);
router.post('/', authenticate, requirePermission(Permissions.ASSETS_WRITE), validate(createAssetSchema), createAsset);
router.get('/:id', authenticate, requirePermission(Permissions.ASSETS_READ), getAsset);
router.put('/:id', authenticate, requirePermission(Permissions.ASSETS_WRITE), validate(updateAssetSchema), updateAsset);
router.delete('/:id', authenticate, requirePermission(Permissions.ASSETS_WRITE), deleteAsset);

export default router;
