import { Response, NextFunction } from 'express';
import { TeamService } from './team.service';
import { AuthRequest, ApiResponse } from '../../types';

const teamService = new TeamService();

export async function listTeam(_req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const users = await teamService.list();
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}

export async function createTeamMember(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const user = await teamService.create(req.body);
    res.status(201).json({ success: true, data: user, message: 'Team member created successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function updateTeamMember(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const user = await teamService.update(req.params.id, req.body);
    res.json({ success: true, data: user, message: 'Team member updated successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function deleteTeamMember(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    await teamService.delete(req.params.id);
    res.json({ success: true, message: 'Team member deleted successfully.' });
  } catch (error) {
    next(error);
  }
}
