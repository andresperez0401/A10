CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'MEMBER');
CREATE TYPE issue_status AS ENUM ('UNDISCUSSED', 'IN_PROGRESS', 'BLOCKED', 'RESOLVED');
CREATE TYPE priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE kpi_nature AS ENUM ('money', 'percentage', 'integer');
CREATE TYPE kpi_operator AS ENUM ('greater_equal', 'less_equal');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'MEMBER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority priority NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status issue_status NOT NULL DEFAULT 'UNDISCUSSED',
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  issue_id UUID REFERENCES issues(id) ON DELETE SET NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nature kpi_nature NOT NULL,
  operator kpi_operator NOT NULL,
  annual_goal DECIMAL(14, 2) NOT NULL,
  unit TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE kpi_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
  week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 52),
  year INT NOT NULL,
  value DECIMAL(14, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kpi_id, week_number, year)
);

CREATE INDEX issues_status_priority_idx ON issues(status, priority);
CREATE INDEX issues_owner_id_idx ON issues(owner_id);
CREATE INDEX issues_due_date_idx ON issues(due_date);
CREATE INDEX todos_issue_id_idx ON todos(issue_id);
CREATE INDEX todos_owner_id_done_idx ON todos(owner_id, done);
CREATE INDEX kpi_values_kpi_id_year_week_number_idx ON kpi_values(kpi_id, year, week_number);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER issues_set_updated_at
BEFORE UPDATE ON issues
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER todos_set_updated_at
BEFORE UPDATE ON todos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER kpis_set_updated_at
BEFORE UPDATE ON kpis
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER kpi_values_set_updated_at
BEFORE UPDATE ON kpi_values
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Justificacion breve:
-- UUID evita IDs secuenciales faciles de inferir y simplifica integraciones distribuidas.
-- ENUM limita roles, estados, prioridades y naturalezas de KPI a valores validos.
-- DECIMAL evita errores de punto flotante en metricas financieras y objetivos.
-- TIMESTAMPTZ conserva auditoria consistente con zona horaria.
-- ON DELETE RESTRICT mantiene trazabilidad de responsables en issues, todos y KPIs.
-- ON DELETE SET NULL en todos.issue_id conserva compromisos aunque se elimine el issue.
-- UNIQUE(kpi_id, week_number, year) evita duplicar mediciones del mismo KPI en una semana.
