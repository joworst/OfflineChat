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
      status TEXT NOT NULL DEFAULT 'sent',
      messageId TEXT,
      timestamp TEXT NOT NULL
    );
  `);
  await db.execAsync(
    `ALTER TABLE messages ADD COLUMN status TEXT NOT NULL DEFAULT 'sent'`
  ).catch(() => {});
  await db.execAsync(
    `ALTER TABLE messages ADD COLUMN messageId TEXT`
  ).catch(() => {});
  return db;
}

export function getDb() {
  return db;
}

export async function saveMessage(deviceId, text, isSent, messageId) {
  if (!db) await initDatabase();
  const timestamp = new Date().toISOString();
  const status = isSent ? 'sent' : 'received';
  const result = await db.runAsync(
    'INSERT INTO messages (deviceId, text, isSent, status, messageId, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
    [deviceId, text, isSent ? 1 : 0, status, messageId || null, timestamp]
  );
  return {
    id: result.lastInsertRowId,
    deviceId,
    text,
    isSent: !!isSent,
    status,
    messageId: messageId || null,
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

export async function updateMessageStatus(messageId, status) {
  if (!db || !messageId) return;
  await db.runAsync(
    'UPDATE messages SET status = ? WHERE messageId = ?',
    [status, messageId]
  );
}

export async function deleteMessages(deviceId) {
  if (!db) return;
  await db.runAsync('DELETE FROM messages WHERE deviceId = ?', [deviceId]);
}
