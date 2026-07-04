function columnExists(db, table, column) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some((col) => col.name === column);
}

function addColumnIfMissing(db, table, column, definition) {
  if (!columnExists(db, table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function runMigrations(db) {
  addColumnIfMissing(db, 'quotations', 'is_selected', "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(db, 'quotations', 'selected_at', 'TEXT');
  addColumnIfMissing(db, 'quotations', 'selected_by', 'TEXT REFERENCES users(id)');
  addColumnIfMissing(db, 'quotations', 'payment_status', "TEXT NOT NULL DEFAULT 'unpaid'");
  addColumnIfMissing(db, 'quotations', 'paid_at', 'TEXT');
  addColumnIfMissing(db, 'quotations', 'paid_by', 'TEXT REFERENCES users(id)');
}

module.exports = { runMigrations };
