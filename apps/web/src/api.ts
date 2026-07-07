import type { CreateIssueInput, Issue, IssueFilters, LoginResponse } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error('Credenciales invalidas');
  }

  return response.json();
}

export async function getIssues(token: string, filters: IssueFilters = {}): Promise<Issue[]> {
  const params = new URLSearchParams();

  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.weekNumber) params.set('week_number', filters.weekNumber);

  const query = params.toString();
  const response = await fetch(`${API_URL}/api/issues${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('No se pudieron cargar los issues');
  }

  const payload = (await response.json()) as { data: Issue[] };
  return payload.data;
}

export async function createIssue(token: string, input: CreateIssueInput): Promise<Issue> {
  const response = await fetch(`${API_URL}/api/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? 'No se pudo crear el issue');
  }

  const payload = (await response.json()) as { data: Issue };
  return payload.data;
}
