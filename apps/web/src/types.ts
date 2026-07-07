export type User = {
  id: string;
  name: string;
  role: string;
  email?: string;
  unit?: string;
};

export type KPIValue = {
  id?: string;
  weekNumber: number;
  year?: number;
  value: number;
};

export type KPI = {
  id: string;
  name: string;
  unit: string;
  nature: 'money' | 'percentage' | 'integer';
  operator: 'greater_equal' | 'less_equal';
  annualGoal: number;
  owner: User;
  values: KPIValue[];
};

export type KpiFormInput = {
  name: string;
  unit: string;
  nature: KPI['nature'];
  operator: KPI['operator'];
  annualGoal: number;
  ownerId: string;
};

export type UpsertKpiValueInput = {
  weekNumber: number;
  year: number;
  value: number;
};

export type Issue = {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'UNDISCUSSED' | 'IN_PROGRESS' | 'BLOCKED' | 'RESOLVED';
  due_date: string;
  created_at: string;
  owner_name: string;
  meeting_week_number: number;
  todos_total: number;
  todos_completed: number;
  days_delayed: number;
};

export type LoginResponse = {
  token: string;
  user: User;
};

export type IssueFilters = {
  status?: string;
  priority?: string;
  weekNumber?: string;
};

export type CreateIssueInput = {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string;
  meetingWeekNumber: number;
};
