import Database from "better-sqlite3";
const db = new Database("ventas.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS ventas (id INTEGER PRIMARY KEY, canal TEXT, mes TEXT, monto INTEGER);
  DELETE FROM ventas;
  INSERT INTO ventas (canal, mes, monto) VALUES
   ('email','2026-07',95000), ('paid_search','2026-07',128000),
   ('organic','2026-07',110000), ('email','2026-06',88000);
`);
console.log("ventas.db lista");
