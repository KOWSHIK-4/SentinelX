import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createTeamMemberSchema, updateTeamMemberSchema } from './team.schema';
import {
  listTeam,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from './team.controller';

const router = Router();

router.get('/', authenticate, listTeam);
router.post('/', authenticate, authorize('Admin'), validate(createTeamMemberSchema), createTeamMember);
router.put('/:id', authenticate, authorize('Admin'), validate(updateTeamMemberSchema), updateTeamMember);
router.delete('/:id', authenticate, authorize('Admin'), deleteTeamMember);

export default router;
