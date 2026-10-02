import Database from "better-sqlite3";
const db = new Database("banco.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS movimientos (id INTEGER PRIMARY KEY, cuenta TEXT, mes TEXT, tipo TEXT, monto INTEGER);
  DELETE FROM movimientos;
  INSERT INTO movimientos (cuenta, mes, tipo, monto) VALUES
   ('CU-1001','2026-09','deposito',15000), ('CU-1001','2026-09','cargo',-3200),
   ('CU-1001','2026-09','cargo',-850),      ('CU-1002','2026-09','deposito',500),
   ('CU-1002','2026-09','retiro',-1200),    ('CU-1001','2026-08','deposito',15000);
`);
console.log("banco.db lista");
