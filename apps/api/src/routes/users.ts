import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' }
  });

  return res.json({ data: users });
});

export default router;
