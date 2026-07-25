import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission, Permissions } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { createTeamMemberSchema, updateTeamMemberSchema } from './team.schema';
import {
  listTeam,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from './team.controller';

const router = Router();

router.get('/', authenticate, requirePermission(Permissions.USERS_MANAGE), listTeam);
router.post('/', authenticate, requirePermission(Permissions.USERS_MANAGE), validate(createTeamMemberSchema), createTeamMember);
router.put('/:id', authenticate, requirePermission(Permissions.USERS_MANAGE), validate(updateTeamMemberSchema), updateTeamMember);
router.delete('/:id', authenticate, requirePermission(Permissions.USERS_MANAGE), deleteTeamMember);

export default router;
