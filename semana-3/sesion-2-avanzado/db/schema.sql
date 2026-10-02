-- NeuronBank: esquema real en Postgres (vs el archivo SQLite de las sesiones 1 y 2).
-- Se ejecuta automáticamente la primera vez que arranca el contenedor de Postgres.

CREATE TABLE clientes (
  id     SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email  TEXT UNIQUE NOT NULL
);

CREATE TABLE cuentas (
  cuenta     TEXT PRIMARY KEY,                 -- ej 'CU-1001'
  cliente_id INT  NOT NULL REFERENCES clientes(id),
  tipo       TEXT NOT NULL,                    -- 'cheques' | 'ahorro'
  moneda     TEXT NOT NULL DEFAULT 'MXN'
);

CREATE TABLE movimientos (
  id          SERIAL PRIMARY KEY,
  cuenta      TEXT NOT NULL REFERENCES cuentas(cuenta),
  fecha       DATE NOT NULL,
  mes         TEXT NOT NULL,                   -- '2026-09' (para consultas por mes)
  tipo        TEXT NOT NULL,                   -- 'deposito' | 'cargo' | 'retiro'
  monto       INTEGER NOT NULL,                -- centavos/enteros; negativo = salida
  descripcion TEXT
);

CREATE INDEX idx_mov_cuenta_mes ON movimientos (cuenta, mes);

-- Datos semilla (mismos CU-* que las sesiones previas, ahora relacionales).
INSERT INTO clientes (nombre, email) VALUES
  ('Jane Smith',   'jane@example.com'),
  ('Rolando Mota', 'rolando@example.com'),
  ('Uriel Zamora', 'uriel@example.com');

INSERT INTO cuentas (cuenta, cliente_id, tipo) VALUES
  ('CU-1001', 1, 'cheques'),
  ('CU-1002', 2, 'ahorro'),
  ('CU-1003', 3, 'cheques');

INSERT INTO movimientos (cuenta, fecha, mes, tipo, monto, descripcion) VALUES
  ('CU-1001', '2026-09-02', '2026-09', 'deposito',  15000, 'Nómina'),
  ('CU-1001', '2026-09-10', '2026-09', 'cargo',     -3200, 'Renta'),
  ('CU-1001', '2026-09-18', '2026-09', 'cargo',      -850, 'Servicios'),
  ('CU-1001', '2026-08-30', '2026-08', 'deposito',  15000, 'Nómina'),
  ('CU-1002', '2026-09-05', '2026-09', 'deposito',    500, 'Transferencia'),
  ('CU-1002', '2026-09-12', '2026-09', 'retiro',    -1200, 'Cajero'),
  ('CU-1003', '2026-09-07', '2026-09', 'deposito',  42000, 'Venta');
