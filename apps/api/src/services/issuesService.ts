import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type IssueStatus = 'UNDISCUSSED' | 'IN_PROGRESS' | 'BLOCKED' | 'RESOLVED';

type IssueFilters = {
  status?: string;
  priority?: string;
  ownerId?: string;
  weekNumber?: number;
};

type CreateIssueInput = {
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  meetingWeekNumber: number;
  ownerId: string;
};

const issueStatuses = new Set<string>(['UNDISCUSSED', 'IN_PROGRESS', 'BLOCKED', 'RESOLVED']);
const priorities = new Set<string>(['LOW', 'MEDIUM', 'HIGH']);

function normalizeToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function calculateDaysDelayed(dueDate: Date, status: string) {
  if (status === 'RESOLVED') return 0;

  const today = normalizeToday();
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  if (due >= today) return 0;

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((today.getTime() - due.getTime()) / millisecondsPerDay);
}

export async function getIssues(filters: IssueFilters) {
  const where: Prisma.IssueWhereInput = {};

  if (filters.status && issueStatuses.has(filters.status)) {
    where.status = filters.status;
  }

  if (filters.priority && priorities.has(filters.priority)) {
    where.priority = filters.priority;
  }

  if (filters.ownerId) {
    where.ownerId = filters.ownerId;
  }

  if (filters.weekNumber && Number.isInteger(filters.weekNumber)) {
    where.meeting = { weekNumber: filters.weekNumber };
  }

  const issues = await prisma.issue.findMany({
    where,
    include: {
      owner: true,
      meeting: true,
      todos: true
    }
  });

  return issues
    .sort((a, b) => {
      const aResolved = a.status === 'RESOLVED' ? 1 : 0;
      const bResolved = b.status === 'RESOLVED' ? 1 : 0;

      if (aResolved !== bResolved) return aResolved - bResolved;
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .map((issue) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      status: issue.status,
      due_date: issue.dueDate.toISOString().slice(0, 10),
      created_at: issue.createdAt.toISOString(),
      owner_name: issue.owner.name,
      meeting_week_number: issue.meeting.weekNumber,
      todos_total: issue.todos.length,
      todos_completed: issue.todos.filter((todo) => todo.done).length,
      days_delayed: calculateDaysDelayed(issue.dueDate, issue.status)
    }));
}

export async function createIssue(input: CreateIssueInput) {
  if (!priorities.has(input.priority)) {
    throw new Error('Invalid priority');
  }

  const meeting = await prisma.meeting.findFirst({
    where: { weekNumber: input.meetingWeekNumber }
  });

  if (!meeting) {
    throw new Error('Meeting week not found');
  }

  const issue = await prisma.issue.create({
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: 'UNDISCUSSED',
      dueDate: new Date(`${input.dueDate}T00:00:00.000Z`),
      ownerId: input.ownerId,
      meetingId: meeting.id
    },
    include: {
      owner: true,
      meeting: true,
      todos: true
    }
  });

  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    priority: issue.priority,
    status: issue.status,
    due_date: issue.dueDate.toISOString().slice(0, 10),
    created_at: issue.createdAt.toISOString(),
    owner_name: issue.owner.name,
    meeting_week_number: issue.meeting.weekNumber,
    todos_total: issue.todos.length,
    todos_completed: 0,
    days_delayed: calculateDaysDelayed(issue.dueDate, issue.status)
  };
}
