import { useState } from 'react';
import type { KPI, User } from '../types';

type KPIScorecardProps = {
  kpis: KPI[];
  selectedWeek: number;
  currentUser: User;
};

type EditingKpi = {
  id: string;
  name: string;
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

export function KPIScorecard({ kpis, selectedWeek, currentUser }: KPIScorecardProps) {
  const [localKpis, setLocalKpis] = useState(kpis);
  const [editingKpi, setEditingKpi] = useState<EditingKpi | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const visibleWeeks = [selectedWeek - 4, selectedWeek - 3, selectedWeek - 2, selectedWeek - 1, selectedWeek];

  function saveValue() {
    if (!editingKpi || draftValue === '') return;

    const value = Number(draftValue);
    if (!Number.isFinite(value)) return;

    setLocalKpis((current) =>
      current.map((kpi) => {
        if (kpi.id !== editingKpi.id) return kpi;

        const values = kpi.values.filter((item) => item.weekNumber !== selectedWeek);
        return { ...kpi, values: [...values, { weekNumber: selectedWeek, value }] };
      })
    );
    setEditingKpi(null);
    setDraftValue('');
  }

  return (
    <section className="scorecard">
      <div className="scorecard-header">
        <p>Seguimiento semanal de metas, avance y actualizaciones pendientes.</p>
        <span className="user-pill">{currentUser.name}</span>
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
            </tr>
          </thead>
          <tbody>
            {localKpis.map((kpi) => {
              const target = weeklyGoal(kpi);
              const currentWeekValue = kpi.values.find((item) => item.weekNumber === selectedWeek);

              return (
                <tr key={kpi.id}>
                  <td>{kpi.owner.name}</td>
                  <td>{kpi.unit}</td>
                  <td className="kpi-name">{kpi.name}</td>
                  <td>{formatValue(kpi, target)}</td>
                  {visibleWeeks.map((week) => {
                    const item = kpi.values.find((value) => value.weekNumber === week);
                    const isCurrentWeek = week === selectedWeek;

                    if (!item && isCurrentWeek) {
                      return (
                        <td key={week} className="cell-empty">
                          <button className="link-button" onClick={() => setEditingKpi({ id: kpi.id, name: kpi.name })}>
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
                        {formatValue(kpi, item.value)}
                      </td>
                    );
                  })}
                  <td>{currentWeekValue ? compliancePercentage({ ...kpi, values: [currentWeekValue] }) : 'Sin dato'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingKpi && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h3 id="modal-title">Actualizar KPI</h3>
            <p>{editingKpi.name}</p>
            <label>
              Valor semana {selectedWeek}
              <input type="number" value={draftValue} onChange={(event) => setDraftValue(event.target.value)} autoFocus />
            </label>
            <div className="modal-actions">
              <button onClick={saveValue}>Guardar</button>
              <button className="secondary" onClick={() => setEditingKpi(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
