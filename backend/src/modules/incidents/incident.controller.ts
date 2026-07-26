import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { IncidentService } from './incident.service';
import { AuthRequest, ApiResponse } from '../../types';
import { incidentQuerySchema } from './incident.schema';
import { createAuditLog } from '../audit/audit.service';
import { emitEvent } from '../../utils/socket';
import { cacheDeletePattern } from '../../config/redis';

type IncidentQuery = z.infer<typeof incidentQuerySchema>;

const incidentService = new IncidentService();

export async function createIncident(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const incident = await incidentService.create(req, req.body);
    await createAuditLog(req, 'Create Incident', 'Incident', incident.id, `Created incident: ${incident.title}`, 'Info');
    emitEvent('incident:created', incident);
    emitEvent('dashboard:statsChanged', { type: 'incident' });
    await cacheDeletePattern('sentinelx:incidents:*');
    await cacheDeletePattern('sentinelx:analytics:*');
    await cacheDeletePattern('sentinelx:reports:*');
    res.status(201).json({ success: true, data: incident, message: 'Incident created successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function getIncidents(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const query = (req.validatedQuery || req.query) as unknown as IncidentQuery;
    const result = await incidentService.findAll(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getIncident(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const incident = await incidentService.findById(req.params.id);
    res.json({ success: true, data: incident });
  } catch (error) {
    next(error);
  }
}

export async function updateIncident(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const incident = await incidentService.update(req.params.id, req.body);
    await createAuditLog(req, 'Update Incident', 'Incident', incident.id, `Updated incident: ${incident.title}`, 'Info');

    const eventName = incident.status === 'RESOLVED' ? 'incident:resolved' : 'incident:updated';
    emitEvent(eventName, incident);
    emitEvent('dashboard:statsChanged', { type: 'incident' });
    await cacheDeletePattern('sentinelx:incidents:*');
    await cacheDeletePattern('sentinelx:analytics:*');
    await cacheDeletePattern('sentinelx:reports:*');

    res.json({ success: true, data: incident, message: 'Incident updated successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function deleteIncident(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const incident = await incidentService.findById(req.params.id);
    await createAuditLog(req, 'Delete Incident', 'Incident', req.params.id, `Deleted incident: ${incident.title}`, 'Warning');
    await incidentService.delete(req.params.id);
    emitEvent('incident:deleted', { id: req.params.id });
    emitEvent('dashboard:statsChanged', { type: 'incident' });
    await cacheDeletePattern('sentinelx:incidents:*');
    await cacheDeletePattern('sentinelx:analytics:*');
    await cacheDeletePattern('sentinelx:reports:*');
    res.json({ success: true, message: 'Incident deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardStats(_req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const stats = await incidentService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}
