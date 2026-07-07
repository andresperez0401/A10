import type { KPI, User } from '../types';

export const currentUser: User = {
  id: 'user_ana',
  name: 'Ana Lopez',
  role: 'ADMIN',
  unit: 'Ventas'
};

export const mockKpis: KPI[] = [
  {
    id: 'kpi_revenue',
    name: 'Ingresos semanales',
    unit: 'Ventas',
    nature: 'money',
    operator: 'greater_equal',
    annualGoal: 62400000,
    owner: currentUser,
    values: [
      { weekNumber: 23, value: 1100000 },
      { weekNumber: 24, value: 1240000 },
      { weekNumber: 25, value: 1190000 },
      { weekNumber: 26, value: 1300000 }
    ]
  },
  {
    id: 'kpi_churn',
    name: 'Churn semanal',
    unit: 'Customer Success',
    nature: 'percentage',
    operator: 'less_equal',
    annualGoal: 26,
    owner: {
      id: 'user_bruno',
      name: 'Bruno Diaz',
      role: 'MANAGER',
      unit: 'Customer Success'
    },
    values: [
      { weekNumber: 23, value: 0.42 },
      { weekNumber: 24, value: 0.61 },
      { weekNumber: 26, value: 0.45 }
    ]
  },
  {
    id: 'kpi_orders',
    name: 'Ordenes procesadas',
    unit: 'Operaciones',
    nature: 'integer',
    operator: 'greater_equal',
    annualGoal: 15600,
    owner: {
      id: 'user_carla',
      name: 'Carla Ruiz',
      role: 'MEMBER',
      unit: 'Operaciones'
    },
    values: [
      { weekNumber: 23, value: 280 },
      { weekNumber: 24, value: 320 },
      { weekNumber: 25, value: 260 },
      { weekNumber: 26, value: 340 }
    ]
  },
  {
    id: 'kpi_margin',
    name: 'Margen bruto',
    unit: 'Finanzas',
    nature: 'percentage',
    operator: 'greater_equal',
    annualGoal: 2080,
    owner: {
      id: 'user_bruno',
      name: 'Bruno Diaz',
      role: 'MANAGER',
      unit: 'Finanzas'
    },
    values: [
      { weekNumber: 24, value: 39.5 },
      { weekNumber: 25, value: 41.2 },
      { weekNumber: 26, value: 38.7 }
    ]
  }
];
