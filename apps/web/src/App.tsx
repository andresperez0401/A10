import { FormEvent, useState } from 'react';
import { createIssue, getIssues, login } from './api';
import { KPIScorecard } from './components/KPIScorecard';
import { currentUser, mockKpis } from './data/mockKpis';
import type { CreateIssueInput, Issue, IssueFilters, User } from './types';

const currentCalendarWeek = 27;

export default function App() {
  const [selectedWeek, setSelectedWeek] = useState(currentCalendarWeek);
  const [email, setEmail] = useState('ana@demo.com');
  const [password, setPassword] = useState('demo123');
  const [token, setToken] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filters, setFilters] = useState<IssueFilters>({});
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [newIssue, setNewIssue] = useState<CreateIssueInput>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '2026-07-15',
    meetingWeekNumber: 27
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const openIssues = issues.filter((issue) => issue.status !== 'RESOLVED').length;
  const delayedIssues = issues.filter((issue) => issue.days_delayed > 0).length;
  const completedTodos = issues.reduce((total, issue) => total + issue.todos_completed, 0);
  const totalTodos = issues.reduce((total, issue) => total + issue.todos_total, 0);

  async function loadIssues(authToken = token, nextFilters = filters) {
    if (!authToken) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const data = await getIssues(authToken, nextFilters);
      setIssues(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const session = await login(email, password);
      setToken(session.token);
      setUser(session.user);
      setSuccessMessage('Sesion iniciada correctamente.');
      await loadIssues(session.token, filters);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  function updateFilters(nextFilters: IssueFilters) {
    setFilters(nextFilters);
    void loadIssues(token, nextFilters);
  }

  async function handleCreateIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await createIssue(token, newIssue);
      setShowIssueModal(false);
      setNewIssue({ title: '', description: '', priority: 'MEDIUM', dueDate: '2026-07-15', meetingWeekNumber: 27 });
      await loadIssues(token, filters);
      setSuccessMessage('Issue creado correctamente.');
      window.setTimeout(() => setSuccessMessage(''), 3500);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="brand">
            <span className="brand-mark">A10</span>
            <span className="brand-copy">
              <strong>A10</strong>
              <small>Leadership Platform</small>
            </span>
          </div>
          <div className="nav-links">
            <a href="#issues">Issues</a>
            <a href="#kpis">KPIs</a>
            {user && <span className="nav-user">{user.name}</span>}
            {user && (
              <button
                className="nav-logout"
                onClick={() => {
                  setToken('');
                  setUser(null);
                  setIssues([]);
                  setSuccessMessage('');
                  setError('');
                }}
              >
                Cerrar sesion
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="app-shell">
      <header className="hero">
          <div>
            <p className="eyebrow">Leadership operations</p>
            <h1>A10 Leadership Overview</h1>
            <p>Weekly leadership issues and KPI scorecard.</p>
          </div>
        {token && <button onClick={() => setShowIssueModal(true)}>Nuevo issue</button>}
      </header>

      <section className="panel auth-panel">
        <div>
          <p className="eyebrow">Secure access</p>
          <h2>Acceso</h2>
        </div>

        {!token ? (
          <form className="login-form" onSubmit={handleLogin}>
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <button disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
          </form>
        ) : (
          <div className="session-row">
            <span>
              Sesion iniciada como <strong>{user?.name}</strong>
            </span>
            <button
              className="secondary"
              onClick={() => {
                  setToken('');
                  setUser(null);
                  setIssues([]);
                  setSuccessMessage('');
                  setError('');
                }}
            >
              Salir
            </button>
          </div>
        )}

        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
      </section>

      {token && (
        <section className="stats-grid" aria-label="Resumen de issues">
          <article className="stat-card">
            <span>Total Issues</span>
            <strong>{issues.length}</strong>
          </article>
          <article className="stat-card">
            <span>Abiertos</span>
            <strong>{openIssues}</strong>
          </article>
          <article className="stat-card warning">
            <span>Atrasados</span>
            <strong>{delayedIssues}</strong>
          </article>
          <article className="stat-card">
            <span>Todos completados</span>
            <strong>
              {completedTodos}/{totalTodos}
            </strong>
          </article>
        </section>
      )}

      {token && (
        <section className="panel issues-panel" id="issues">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Execution tracking</p>
              <h2>Issues</h2>
            </div>
            <div className="panel-actions">
              <button className="secondary" onClick={() => void loadIssues()} disabled={loading}>
                {loading ? 'Cargando...' : 'Recargar'}
              </button>
              <button onClick={() => setShowIssueModal(true)}>Nuevo issue</button>
            </div>
          </div>

          <div className="filters-row">
            <label>
              Status
              <select value={filters.status ?? ''} onChange={(event) => updateFilters({ ...filters, status: event.target.value || undefined })}>
                <option value="">Todos</option>
                <option value="UNDISCUSSED">UNDISCUSSED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </label>
            <label>
              Priority
              <select value={filters.priority ?? ''} onChange={(event) => updateFilters({ ...filters, priority: event.target.value || undefined })}>
                <option value="">Todas</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </label>
            <label>
              Semana
              <select value={filters.weekNumber ?? ''} onChange={(event) => updateFilters({ ...filters, weekNumber: event.target.value || undefined })}>
                <option value="">Todas</option>
                <option value="26">26</option>
                <option value="27">27</option>
              </select>
            </label>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Owner</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Semana</th>
                  <th>Due date</th>
                  <th>Todos</th>
                  <th>Dias atraso</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue.id}>
                    <td>
                      <strong>{issue.title}</strong>
                      <small>{issue.description}</small>
                    </td>
                    <td>{issue.owner_name}</td>
                    <td>
                      <span className={`badge priority-${issue.priority.toLowerCase()}`}>{issue.priority}</span>
                    </td>
                    <td>
                      <span className={`badge status-${issue.status.toLowerCase().replace('_', '-')}`}>{issue.status}</span>
                    </td>
                    <td>{issue.meeting_week_number}</td>
                    <td>{issue.due_date}</td>
                    <td>
                      {issue.todos_completed}/{issue.todos_total}
                    </td>
                    <td className={issue.days_delayed > 0 ? 'delay-badge' : ''}>{issue.days_delayed}</td>
                  </tr>
                ))}
                {!issues.length && !loading && (
                  <tr>
                    <td colSpan={8}>No hay issues para los filtros seleccionados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section id="kpis">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Performance indicators</p>
            <h2>KPI Scorecard</h2>
          </div>
          <div className="week-controls" aria-label="Selector de semana">
            <button className="secondary" onClick={() => setSelectedWeek((week) => Math.max(5, week - 1))}>Semana anterior</button>
            <strong>Semana {selectedWeek}</strong>
            <button className="secondary" onClick={() => setSelectedWeek((week) => Math.min(currentCalendarWeek, week + 1))} disabled={selectedWeek >= currentCalendarWeek}>
              Semana siguiente
            </button>
          </div>
        </div>
        <KPIScorecard kpis={mockKpis} selectedWeek={selectedWeek} currentUser={currentUser} />
      </section>

      {showIssueModal && (
        <div className="modal-backdrop" role="presentation">
          <form className="modal issue-modal" role="dialog" aria-modal="true" onSubmit={handleCreateIssue}>
            <h3>Nuevo issue</h3>
            <p>Crea un issue asignado al usuario autenticado.</p>
            <label>
              Titulo
              <input required value={newIssue.title} onChange={(event) => setNewIssue({ ...newIssue, title: event.target.value })} />
            </label>
            <label>
              Descripcion
              <textarea required value={newIssue.description} onChange={(event) => setNewIssue({ ...newIssue, description: event.target.value })} />
            </label>
            <div className="form-grid">
              <label>
                Prioridad
                <select value={newIssue.priority} onChange={(event) => setNewIssue({ ...newIssue, priority: event.target.value as CreateIssueInput['priority'] })}>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </label>
              <label>
                Semana
                <select value={newIssue.meetingWeekNumber} onChange={(event) => setNewIssue({ ...newIssue, meetingWeekNumber: Number(event.target.value) })}>
                  <option value={26}>26</option>
                  <option value={27}>27</option>
                </select>
              </label>
            </div>
            <label>
              Fecha limite
              <input type="date" required value={newIssue.dueDate} onChange={(event) => setNewIssue({ ...newIssue, dueDate: event.target.value })} />
            </label>
            <div className="modal-actions">
              <button disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
              <button type="button" className="secondary" onClick={() => setShowIssueModal(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
      </main>
    </>
  );
}
