import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// На Web expo-sqlite не работает (нет SharedArrayBuffer), поэтому там данные хранятся в памяти.
const WEB = Platform.OS === 'web';
const db = WEB ? null : SQLite.openDatabaseSync('fittrack.db');
const mem = { users: [], bookings: [], tasks: [], id: 1 };

export function initDb() {
  if (WEB) return;
  db.execSync(`
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, password TEXT);
    CREATE TABLE IF NOT EXISTS bookings(id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, exercise TEXT, date TEXT, time TEXT);
    CREATE TABLE IF NOT EXISTS tasks(id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, title TEXT, done INTEGER DEFAULT 0);
  `);
}

export const registerUser = (n, e, p) => {
  if (WEB) {
    if (mem.users.some((u) => u.email === e)) return false;
    mem.users.push({ id: mem.id++, name: n, email: e, password: p });
    return true;
  }
  try { db.runSync('INSERT INTO users(name,email,password) VALUES(?,?,?)', [n, e, p]); return true; }
  catch { return false; }
};
export const loginUser = (e, p) => WEB
  ? mem.users.find((u) => u.email === e && u.password === p) || null
  : db.getFirstSync('SELECT * FROM users WHERE email=? AND password=?', [e, p]);

export const addBooking = (u, ex, d, t) => WEB
  ? void mem.bookings.push({ id: mem.id++, userId: u, exercise: ex, date: d, time: t })
  : db.runSync('INSERT INTO bookings(userId,exercise,date,time) VALUES(?,?,?,?)', [u, ex, d, t]);
export const getBookings = (u) => WEB
  ? mem.bookings.filter((b) => b.userId === u).reverse()
  : db.getAllSync('SELECT * FROM bookings WHERE userId=? ORDER BY id DESC', [u]);
export const isBusy = (d, t) => WEB
  ? mem.bookings.some((b) => b.date === d && b.time === t)
  : !!db.getFirstSync('SELECT id FROM bookings WHERE date=? AND time=?', [d, t]);
export const delBooking = (id) => WEB
  ? void (mem.bookings = mem.bookings.filter((b) => b.id !== id))
  : db.runSync('DELETE FROM bookings WHERE id=?', [id]);

// ---- Чек-лист тренировки (семинар 8, лаба 13) ----
export const getTasks = (u) => WEB
  ? mem.tasks.filter((t) => t.userId === u).reverse()
  : db.getAllSync('SELECT * FROM tasks WHERE userId=? ORDER BY id DESC', [u]);
export const addTask = (u, title) => WEB
  ? void mem.tasks.push({ id: mem.id++, userId: u, title, done: 0 })
  : db.runSync('INSERT INTO tasks(userId,title,done) VALUES(?,?,0)', [u, title]);
export const toggleTask = (id, done) => WEB
  ? void mem.tasks.forEach((t) => { if (t.id === id) t.done = done; })
  : db.runSync('UPDATE tasks SET done=? WHERE id=?', [done, id]);
export const delTask = (id) => WEB
  ? void (mem.tasks = mem.tasks.filter((t) => t.id !== id))
  : db.runSync('DELETE FROM tasks WHERE id=?', [id]);