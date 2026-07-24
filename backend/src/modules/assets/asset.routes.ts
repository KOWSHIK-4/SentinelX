import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
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

router.get('/', authenticate, validate(assetQuerySchema, 'query'), getAssets);
router.post('/', authenticate, authorize('Admin', 'Analyst'), validate(createAssetSchema), createAsset);
router.get('/:id', authenticate, getAsset);
router.put('/:id', authenticate, authorize('Admin', 'Analyst'), validate(updateAssetSchema), updateAsset);
router.delete('/:id', authenticate, authorize('Admin'), deleteAsset);

export default router;
