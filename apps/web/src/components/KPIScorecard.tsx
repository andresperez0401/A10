import { FormEvent, useState } from 'react';
import type { KPI, KpiFormInput, UpsertKpiValueInput, User } from '../types';

type KPIScorecardProps = {
  kpis: KPI[];
  users: User[];
  selectedWeek: number;
  selectedYear: number;
  currentUser: User;
  loading: boolean;
  onCreateKpi: (input: KpiFormInput) => Promise<void>;
  onUpdateKpi: (id: string, input: KpiFormInput) => Promise<void>;
  onDeleteKpi: (id: string) => Promise<void>;
  onSaveKpiValue: (id: string, input: UpsertKpiValueInput) => Promise<void>;
};

type EditingValue = {
  id: string;
  name: string;
  currentValue: string;
};

type EditingKpi = {
  id: string;
  input: KpiFormInput;
};

const emptyKpiForm: KpiFormInput = {
  name: '',
  unit: '',
  nature: 'money',
  operator: 'greater_equal',
  annualGoal: 0,
  ownerId: ''
};

function weeklyGoal(kpi: KPI) {
  return kpi.annualGoal / 52;
}

function isOnTarget(kpi: KPI, value: number) {
  const target = weeklyGoal(kpi);
  return kpi.operator === 'greater_equal' ? value >= target : value <= target;
}

function formatValue(kpi: KPI, value: number) {
  if (kpi.nature === 'money') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }

  if (kpi.nature === 'percentage') {
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)}%`;
  }

  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

function compliancePercentage(kpi: KPI) {
  const target = weeklyGoal(kpi);
  const currentValue = kpi.values.find((item) => item.weekNumber === Math.max(...kpi.values.map((item) => item.weekNumber)))?.value;

  if (!currentValue || target === 0) return 'Sin dato';

  const compliance = kpi.operator === 'greater_equal' ? (currentValue / target) * 100 : (target / currentValue) * 100;
  return `${Math.min(compliance, 999).toFixed(1)}%`;
}

function toFormInput(kpi: KPI): KpiFormInput {
  return {
    name: kpi.name,
    unit: kpi.unit,
    nature: kpi.nature,
    operator: kpi.operator,
    annualGoal: kpi.annualGoal,
    ownerId: kpi.owner.id
  };
}

export function KPIScorecard({
  kpis,
  users,
  selectedWeek,
  selectedYear,
  currentUser,
  loading,
  onCreateKpi,
  onUpdateKpi,
  onDeleteKpi,
  onSaveKpiValue
}: KPIScorecardProps) {
  const [editingValue, setEditingValue] = useState<EditingValue | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingKpi, setEditingKpi] = useState<EditingKpi | null>(null);
  const [draftKpi, setDraftKpi] = useState<KpiFormInput>({ ...emptyKpiForm, ownerId: currentUser.id });
  const visibleWeeks = [selectedWeek - 4, selectedWeek - 3, selectedWeek - 2, selectedWeek - 1, selectedWeek];

  function openCreateModal() {
    setDraftKpi({ ...emptyKpiForm, ownerId: users[0]?.id ?? currentUser.id });
    setShowCreateModal(true);
  }

  function openEditModal(kpi: KPI) {
    setEditingKpi({ id: kpi.id, input: toFormInput(kpi) });
  }

  function openValueModal(kpi: KPI, currentValue?: number) {
    setEditingValue({ id: kpi.id, name: kpi.name, currentValue: currentValue === undefined ? '' : String(currentValue) });
  }

  async function saveValue() {
    if (!editingValue || editingValue.currentValue === '') return;

    const value = Number(editingValue.currentValue);
    if (!Number.isFinite(value)) return;

    await onSaveKpiValue(editingValue.id, { weekNumber: selectedWeek, year: selectedYear, value });
    setEditingValue(null);
  }

  async function saveNewKpi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onCreateKpi(draftKpi);
    setShowCreateModal(false);
  }

  async function saveEditedKpi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingKpi) return;

    await onUpdateKpi(editingKpi.id, editingKpi.input);
    setEditingKpi(null);
  }

  async function removeKpi(kpi: KPI) {
    const confirmed = window.confirm(`Eliminar KPI "${kpi.name}"? Tambien se eliminaran sus valores guardados.`);
    if (!confirmed) return;

    await onDeleteKpi(kpi.id);
  }

  return (
    <section className="scorecard">
      <div className="scorecard-header">
        <p>Seguimiento semanal de metas, avance y actualizaciones guardadas en BD.</p>
        <div className="scorecard-actions">
          <span className="user-pill">{currentUser.name}</span>
          <button onClick={openCreateModal} disabled={loading || !users.length}>
            Nuevo KPI
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Responsable</th>
              <th>Unidad</th>
              <th>KPI</th>
              <th>Meta</th>
              {visibleWeeks.map((week, index) => (
                <th key={week}>{index === 4 ? 'S-actual' : `S-${4 - index}`}</th>
              ))}
              <th>% Cumplimiento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {kpis.map((kpi) => {
              const target = weeklyGoal(kpi);
              const currentWeekValue = kpi.values.find((item) => item.weekNumber === selectedWeek && (item.year ?? selectedYear) === selectedYear);

              return (
                <tr key={kpi.id}>
                  <td>{kpi.owner.name}</td>
                  <td>{kpi.unit}</td>
                  <td className="kpi-name">{kpi.name}</td>
                  <td>{formatValue(kpi, target)}</td>
                  {visibleWeeks.map((week) => {
                    const item = kpi.values.find((value) => value.weekNumber === week && (value.year ?? selectedYear) === selectedYear);
                    const isCurrentWeek = week === selectedWeek;

                    if (!item && isCurrentWeek) {
                      return (
                        <td key={week} className="cell-empty">
                          <button className="link-button" onClick={() => openValueModal(kpi)} disabled={loading}>
                            + Actualizar
                          </button>
                        </td>
                      );
                    }

                    if (!item) {
                      return (
                        <td key={week} className="cell-empty">
                          Sin dato
                        </td>
                      );
                    }

                    return (
                      <td key={week} className={isOnTarget(kpi, item.value) ? 'cell-ok' : 'cell-bad'}>
                        {isCurrentWeek ? (
                          <button className="value-button" onClick={() => openValueModal(kpi, item.value)} disabled={loading}>
                            {formatValue(kpi, item.value)}
                          </button>
                        ) : (
                          formatValue(kpi, item.value)
                        )}
                      </td>
                    );
                  })}
                  <td>{currentWeekValue ? compliancePercentage({ ...kpi, values: [currentWeekValue] }) : 'Sin dato'}</td>
                  <td>
                    <div className="row-actions">
                      <button className="link-button" onClick={() => openEditModal(kpi)} disabled={loading}>
                        Editar
                      </button>
                      <button className="link-button danger-link" onClick={() => void removeKpi(kpi)} disabled={loading}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!kpis.length && !loading && (
              <tr>
                <td colSpan={11}>No hay KPIs guardados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingValue && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h3 id="modal-title">Actualizar KPI</h3>
            <p>{editingValue.name}</p>
            <label>
              Valor semana {selectedWeek}
              <input type="number" value={editingValue.currentValue} onChange={(event) => setEditingValue({ ...editingValue, currentValue: event.target.value })} autoFocus />
            </label>
            <div className="modal-actions">
              <button onClick={() => void saveValue()} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
              <button className="secondary" onClick={() => setEditingValue(null)} disabled={loading}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <KpiFormModal
          title="Nuevo KPI"
          input={draftKpi}
          users={users}
          loading={loading}
          onChange={setDraftKpi}
          onSubmit={saveNewKpi}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {editingKpi && (
        <KpiFormModal
          title="Editar KPI"
          input={editingKpi.input}
          users={users}
          loading={loading}
          onChange={(input) => setEditingKpi({ ...editingKpi, input })}
          onSubmit={saveEditedKpi}
          onCancel={() => setEditingKpi(null)}
        />
      )}
    </section>
  );
}

type KpiFormModalProps = {
  title: string;
  input: KpiFormInput;
  users: User[];
  loading: boolean;
  onChange: (input: KpiFormInput) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onCancel: () => void;
};

function KpiFormModal({ title, input, users, loading, onChange, onSubmit, onCancel }: KpiFormModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal kpi-modal" role="dialog" aria-modal="true" onSubmit={(event) => void onSubmit(event)}>
        <h3>{title}</h3>
        <p>Define el KPI y su responsable. Los cambios quedan guardados en BD.</p>
        <label>
          Nombre
          <input required value={input.name} onChange={(event) => onChange({ ...input, name: event.target.value })} autoFocus />
        </label>
        <div className="form-grid">
          <label>
            Unidad
            <input required value={input.unit} onChange={(event) => onChange({ ...input, unit: event.target.value })} />
          </label>
          <label>
            Responsable
            <select required value={input.ownerId} onChange={(event) => onChange({ ...input, ownerId: event.target.value })}>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label>
            Naturaleza
            <select value={input.nature} onChange={(event) => onChange({ ...input, nature: event.target.value as KpiFormInput['nature'] })}>
              <option value="money">Dinero</option>
              <option value="percentage">Porcentaje</option>
              <option value="integer">Entero</option>
            </select>
          </label>
          <label>
            Operador
            <select value={input.operator} onChange={(event) => onChange({ ...input, operator: event.target.value as KpiFormInput['operator'] })}>
              <option value="greater_equal">Mayor o igual</option>
              <option value="less_equal">Menor o igual</option>
            </select>
          </label>
        </div>
        <label>
          Meta anual
          <input required type="number" value={input.annualGoal} onChange={(event) => onChange({ ...input, annualGoal: Number(event.target.value) })} />
        </label>
        <div className="modal-actions">
          <button disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
          <button type="button" className="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
