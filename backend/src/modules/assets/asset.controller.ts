import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AssetService } from './asset.service';
import { AuthRequest, ApiResponse } from '../../types';
import { assetQuerySchema } from './asset.schema';
import { createAuditLog } from '../audit/audit.service';

type AssetQuery = z.infer<typeof assetQuerySchema>;

const assetService = new AssetService();

export async function createAsset(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const asset = await assetService.create(req.body);
    await createAuditLog(req, 'Create Asset', 'Asset', asset.id, `Created asset: ${asset.assetName}`, 'Info');
    res.status(201).json({ success: true, data: asset, message: 'Asset created successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function getAssets(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const query = (req.validatedQuery || req.query) as unknown as AssetQuery;
    const result = await assetService.findAll(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getAsset(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const asset = await assetService.findById(req.params.id);
    res.json({ success: true, data: asset });
  } catch (error) {
    next(error);
  }
}

export async function updateAsset(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const asset = await assetService.update(req.params.id, req.body);
    await createAuditLog(req, 'Update Asset', 'Asset', asset.id, `Updated asset: ${asset.assetName}`, 'Info');
    res.json({ success: true, data: asset, message: 'Asset updated successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function deleteAsset(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const asset = await assetService.findById(req.params.id);
    await createAuditLog(req, 'Delete Asset', 'Asset', req.params.id, `Deleted asset: ${asset.assetName}`, 'Warning');
    await assetService.delete(req.params.id);
    res.json({ success: true, message: 'Asset deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function getAssetStats(_req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const stats = await assetService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}
