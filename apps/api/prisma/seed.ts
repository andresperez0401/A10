import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.kPIValue.deleteMany();
  await prisma.kPI.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('demo123', 10);
  const basePasswordHash = await bcrypt.hash('12345678', 10);

  const [ana, bruno, carla, santiago] = await Promise.all([
    prisma.user.create({
      data: { name: 'Ana Lopez', email: 'ana@demo.com', passwordHash, role: 'ADMIN' }
    }),
    prisma.user.create({
      data: { name: 'Bruno Diaz', email: 'bruno@demo.com', passwordHash, role: 'MANAGER' }
    }),
    prisma.user.create({
      data: { name: 'Carla Ruiz', email: 'carla@demo.com', passwordHash, role: 'MEMBER' }
    }),
    prisma.user.create({
      data: { name: 'Santiago Londono', email: 'slondono@anagram-us.com', passwordHash: basePasswordHash, role: 'ADMIN' }
    })
  ]);

  const [week26, week27] = await Promise.all([
    prisma.meeting.create({ data: { weekNumber: 26, meetingDate: new Date('2026-06-24T10:00:00.000Z') } }),
    prisma.meeting.create({ data: { weekNumber: 27, meetingDate: new Date('2026-07-01T10:00:00.000Z') } })
  ]);

  const issues = await Promise.all([
    prisma.issue.create({
      data: {
        title: 'Definir responsable de inventario',
        description: 'Asignar ownership operativo del inventario semanal.',
        priority: 'HIGH',
        status: 'UNDISCUSSED',
        dueDate: new Date('2026-06-30T00:00:00.000Z'),
        ownerId: ana.id,
        meetingId: week27.id,
        createdAt: new Date('2026-06-25T09:00:00.000Z')
      }
    }),
    prisma.issue.create({
      data: {
        title: 'Reducir tiempos de cierre contable',
        description: 'Revisar bloqueos del cierre y comprometer acciones.',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        dueDate: new Date('2026-07-10T00:00:00.000Z'),
        ownerId: bruno.id,
        meetingId: week27.id,
        createdAt: new Date('2026-06-26T11:00:00.000Z')
      }
    }),
    prisma.issue.create({
      data: {
        title: 'Actualizar forecast comercial',
        description: 'Subir forecast actualizado antes de la reunion semanal.',
        priority: 'HIGH',
        status: 'BLOCKED',
        dueDate: new Date('2026-07-03T00:00:00.000Z'),
        ownerId: carla.id,
        meetingId: week27.id,
        createdAt: new Date('2026-06-27T12:00:00.000Z')
      }
    }),
    prisma.issue.create({
      data: {
        title: 'Documentar checklist de onboarding',
        description: 'Crear checklist inicial para nuevas incorporaciones.',
        priority: 'LOW',
        status: 'RESOLVED',
        dueDate: new Date('2026-06-20T00:00:00.000Z'),
        ownerId: ana.id,
        meetingId: week26.id,
        createdAt: new Date('2026-06-19T15:00:00.000Z')
      }
    }),
    prisma.issue.create({
      data: {
        title: 'Revisar desviacion de margen',
        description: 'Analizar las principales causas de desviacion mensual.',
        priority: 'MEDIUM',
        status: 'UNDISCUSSED',
        dueDate: new Date('2026-07-05T00:00:00.000Z'),
        ownerId: bruno.id,
        meetingId: week26.id,
        createdAt: new Date('2026-06-23T08:00:00.000Z')
      }
    })
  ]);

  await prisma.todo.createMany({
    data: [
      { title: 'Validar stock fisico', issueId: issues[0].id, ownerId: ana.id, done: true },
      { title: 'Definir backup operativo', issueId: issues[0].id, ownerId: bruno.id, done: false },
      { title: 'Levantar bloqueos de cierre', issueId: issues[1].id, ownerId: bruno.id, done: false },
      { title: 'Confirmar forecast con ventas', issueId: issues[2].id, ownerId: carla.id, done: false },
      { title: 'Publicar checklist', issueId: issues[3].id, ownerId: ana.id, done: true },
      { title: 'Extraer reporte de margen', issueId: issues[4].id, ownerId: bruno.id, done: true },
      { title: 'Enviar causas raiz', issueId: issues[4].id, ownerId: carla.id, done: false }
    ]
  });

  const [revenue, churn, orders, margin] = await Promise.all([
    prisma.kPI.create({
      data: { name: 'Ingresos semanales', nature: 'money', operator: 'greater_equal', annualGoal: 62400000, unit: 'Ventas', ownerId: ana.id }
    }),
    prisma.kPI.create({
      data: { name: 'Churn semanal', nature: 'percentage', operator: 'less_equal', annualGoal: 26, unit: 'Customer Success', ownerId: bruno.id }
    }),
    prisma.kPI.create({
      data: { name: 'Ordenes procesadas', nature: 'integer', operator: 'greater_equal', annualGoal: 15600, unit: 'Operaciones', ownerId: carla.id }
    }),
    prisma.kPI.create({
      data: { name: 'Margen bruto', nature: 'percentage', operator: 'greater_equal', annualGoal: 2080, unit: 'Finanzas', ownerId: bruno.id }
    })
  ]);

  await prisma.kPIValue.createMany({
    data: [
      { kpiId: revenue.id, weekNumber: 23, year: 2026, value: 1100000 },
      { kpiId: revenue.id, weekNumber: 24, year: 2026, value: 1240000 },
      { kpiId: revenue.id, weekNumber: 25, year: 2026, value: 1190000 },
      { kpiId: revenue.id, weekNumber: 26, year: 2026, value: 1300000 },
      { kpiId: churn.id, weekNumber: 23, year: 2026, value: 0.42 },
      { kpiId: churn.id, weekNumber: 24, year: 2026, value: 0.61 },
      { kpiId: churn.id, weekNumber: 26, year: 2026, value: 0.45 },
      { kpiId: orders.id, weekNumber: 23, year: 2026, value: 280 },
      { kpiId: orders.id, weekNumber: 24, year: 2026, value: 320 },
      { kpiId: orders.id, weekNumber: 25, year: 2026, value: 260 },
      { kpiId: orders.id, weekNumber: 26, year: 2026, value: 340 },
      { kpiId: margin.id, weekNumber: 24, year: 2026, value: 39.5 },
      { kpiId: margin.id, weekNumber: 25, year: 2026, value: 41.2 },
      { kpiId: margin.id, weekNumber: 26, year: 2026, value: 38.7 }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
