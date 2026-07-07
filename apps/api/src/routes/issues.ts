import { Router } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { createIssue, getIssues } from '../services/issuesService';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const issues = await getIssues({
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    priority: typeof req.query.priority === 'string' ? req.query.priority : undefined,
    ownerId: typeof req.query.owner_id === 'string' ? req.query.owner_id : undefined,
    weekNumber: typeof req.query.week_number === 'string' ? Number(req.query.week_number) : undefined
  });

  res.json({ data: issues });
});

router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { title, description, priority, dueDate, meetingWeekNumber } = req.body as {
    title?: string;
    description?: string;
    priority?: string;
    dueDate?: string;
    meetingWeekNumber?: number;
  };

  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!title || !description || !priority || !dueDate || !meetingWeekNumber) {
    return res.status(400).json({ error: 'title, description, priority, dueDate and meetingWeekNumber are required' });
  }

  try {
    const issue = await createIssue({
      title,
      description,
      priority,
      dueDate,
      meetingWeekNumber,
      ownerId: req.user.userId
    });

    return res.status(201).json({ data: issue });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Could not create issue' });
  }
});

export default router;
