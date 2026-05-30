const Database = require("better-sqlite3");

// this will create crm.db automatically
const db = new Database("crm.db");

// tables create
db.exec(`
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT UNIQUE,
  customer_name TEXT,
  customer_email TEXT,
  subject TEXT,
  description TEXT,
  status TEXT DEFAULT 'Open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT,
  note_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

module.exports = db;