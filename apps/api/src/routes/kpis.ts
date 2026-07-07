import { PrismaClient, Prisma } from '@prisma/client';
import { Router } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

const validNatures = new Set(['money', 'percentage', 'integer']);
const validOperators = new Set(['greater_equal', 'less_equal']);

type KpiWithRelations = Prisma.KPIGetPayload<{
  include: {
    owner: { select: { id: true; name: true; email: true; role: true } };
    values: true;
  };
}>;

function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function serializeKpi(kpi: KpiWithRelations) {
  return {
    ...kpi,
    annualGoal: Number(kpi.annualGoal),
    values: kpi.values.map((value) => ({
      ...value,
      value: Number(value.value)
    }))
  };
}

router.get('/', requireAuth, async (_req, res) => {
  const kpis = await prisma.kPI.findMany({
    include: {
      owner: { select: { id: true, name: true, email: true, role: true } },
      values: { orderBy: [{ year: 'asc' }, { weekNumber: 'asc' }] }
    },
    orderBy: { createdAt: 'asc' }
  });

  return res.json({ data: kpis.map(serializeKpi) });
});

router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { name, unit, nature, operator, annualGoal, ownerId } = req.body as {
    name?: string;
    unit?: string;
    nature?: string;
    operator?: string;
    annualGoal?: unknown;
    ownerId?: string;
  };
  const parsedAnnualGoal = toNumber(annualGoal);

  if (!name || !unit || !nature || !operator || parsedAnnualGoal === null || !ownerId) {
    return res.status(400).json({ error: 'name, unit, nature, operator, annualGoal and ownerId are required' });
  }

  if (!validNatures.has(nature) || !validOperators.has(operator)) {
    return res.status(400).json({ error: 'Invalid KPI nature or operator' });
  }

  try {
    const kpi = await prisma.kPI.create({
      data: { name, unit, nature, operator, annualGoal: parsedAnnualGoal, ownerId },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        values: { orderBy: [{ year: 'asc' }, { weekNumber: 'asc' }] }
      }
    });

    return res.status(201).json({ data: serializeKpi(kpi) });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Could not create KPI' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const { name, unit, nature, operator, annualGoal, ownerId } = req.body as {
    name?: string;
    unit?: string;
    nature?: string;
    operator?: string;
    annualGoal?: unknown;
    ownerId?: string;
  };
  const parsedAnnualGoal = toNumber(annualGoal);

  if (!name || !unit || !nature || !operator || parsedAnnualGoal === null || !ownerId) {
    return res.status(400).json({ error: 'name, unit, nature, operator, annualGoal and ownerId are required' });
  }

  if (!validNatures.has(nature) || !validOperators.has(operator)) {
    return res.status(400).json({ error: 'Invalid KPI nature or operator' });
  }

  try {
    const kpi = await prisma.kPI.update({
      where: { id },
      data: { name, unit, nature, operator, annualGoal: parsedAnnualGoal, ownerId },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        values: { orderBy: [{ year: 'asc' }, { weekNumber: 'asc' }] }
      }
    });

    return res.json({ data: serializeKpi(kpi) });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Could not update KPI' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = String(req.params.id);

  try {
    await prisma.kPI.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Could not delete KPI' });
  }
});

router.put('/:id/values', requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const { weekNumber, year, value } = req.body as { weekNumber?: unknown; year?: unknown; value?: unknown };
  const parsedWeekNumber = toNumber(weekNumber);
  const parsedYear = toNumber(year);
  const parsedValue = toNumber(value);

  if (parsedWeekNumber === null || parsedYear === null || parsedValue === null) {
    return res.status(400).json({ error: 'weekNumber, year and value are required' });
  }

  if (parsedWeekNumber < 1 || parsedWeekNumber > 52) {
    return res.status(400).json({ error: 'weekNumber must be between 1 and 52' });
  }

  try {
    const kpiValue = await prisma.kPIValue.upsert({
      where: {
        kpiId_weekNumber_year: {
          kpiId: id,
          weekNumber: parsedWeekNumber,
          year: parsedYear
        }
      },
      update: { value: parsedValue },
      create: { kpiId: id, weekNumber: parsedWeekNumber, year: parsedYear, value: parsedValue }
    });

    return res.json({ data: { ...kpiValue, value: Number(kpiValue.value) } });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Could not save KPI value' });
  }
});

export default router;
