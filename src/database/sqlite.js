import * as SQLite from 'expo-sqlite';

let db;

export async function initDatabase() {
  db = await SQLite.openDatabaseAsync('offlinechat.db');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deviceId TEXT NOT NULL,
      text TEXT NOT NULL,
      isSent INTEGER NOT NULL DEFAULT 1,
      timestamp TEXT NOT NULL
    );
  `);
}

export async function saveMessage(deviceId, text, isSent) {
  if (!db) await initDatabase();
  const timestamp = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO messages (deviceId, text, isSent, timestamp) VALUES (?, ?, ?, ?)',
    [deviceId, text, isSent ? 1 : 0, timestamp]
  );
  return {
    id: result.lastInsertRowId,
    deviceId,
    text,
    isSent: !!isSent,
    timestamp,
  };
}

export async function getMessages(deviceId) {
  if (!db) await initDatabase();
  const rows = await db.getAllAsync(
    'SELECT * FROM messages WHERE deviceId = ? ORDER BY timestamp ASC',
    [deviceId]
  );
  return rows.map(r => ({ ...r, isSent: !!r.isSent }));
}
