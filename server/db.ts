import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

let pool: mysql.Pool | null = null;

export const getDb = async () => {
  if (!pool) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is required to connect to the database.');
    }

    pool = mysql.createPool({
      uri: dbUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Seed demo data on first connection
    await seedDemoData(pool);
  }
  return pool;
};

const seedDemoData = async (db: mysql.Pool) => {
  try {
    // Guard: only seed if demo groups don't exist yet
    const [demoGroups] = await db.query<any[]>('SELECT id FROM groups_table WHERE id = ?', ['demo-group-1']);
    if (demoGroups.length > 0) {
      console.log('Demo data already seeded.');
      return;
    }

    console.log('Seeding demo data...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // ── Demo Users (INSERT IGNORE: safe if user already exists) ──────────────
    await db.query('INSERT IGNORE INTO users (id, name, email, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)', ['demo-user-id',    'Ankush', 'demo@fairshare.com', hashedPassword, now, now]);
    await db.query('INSERT IGNORE INTO users (id, name, email, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)', ['demo-user-rahul', 'Rahul',  'rahul@demo.com',      hashedPassword, now, now]);
    await db.query('INSERT IGNORE INTO users (id, name, email, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)', ['demo-user-priya', 'Priya',  'priya@demo.com',      hashedPassword, now, now]);
    await db.query('INSERT IGNORE INTO users (id, name, email, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)', ['demo-user-sara',  'Sara',   'sara@demo.com',       hashedPassword, now, now]);
    await db.query('INSERT IGNORE INTO users (id, name, email, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)', ['demo-user-karan', 'Karan',  'karan@demo.com',      hashedPassword, now, now]);

    // ── Group 1: Goa Trip (4 members, ₹15,800 total) ─────────────────────────
    await db.query('INSERT INTO groups_table (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)', ['demo-group-1', 'Goa Trip 🏖️', now, now]);
    for (const uid of ['demo-user-id', 'demo-user-rahul', 'demo-user-priya', 'demo-user-sara']) {
      await db.query('INSERT INTO group_members (id, groupId, userId, joinedAt) VALUES (?, ?, ?, ?)', [randomUUID(), 'demo-group-1', uid, now]);
    }
    // Exp 1 – Flight tickets ₹8000, paid by Ankush, split 4 ways (₹2000 each)
    await db.query('INSERT INTO expenses (id, groupId, description, amount, paidById, category, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['demo-exp-1', 'demo-group-1', 'Flight tickets', 8000, 'demo-user-id', 'Travel', now, now]);
    for (const uid of ['demo-user-id', 'demo-user-rahul', 'demo-user-priya', 'demo-user-sara']) {
      await db.query('INSERT INTO expense_splits (id, expenseId, userId, amount) VALUES (?, ?, ?, ?)', [randomUUID(), 'demo-exp-1', uid, 2000]);
    }
    // Exp 2 – Hotel stay ₹4800, paid by Rahul, split 4 ways (₹1200 each)
    await db.query('INSERT INTO expenses (id, groupId, description, amount, paidById, category, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['demo-exp-2', 'demo-group-1', 'Hotel stay (2 nights)', 4800, 'demo-user-rahul', 'Accommodation', now, now]);
    for (const uid of ['demo-user-id', 'demo-user-rahul', 'demo-user-priya', 'demo-user-sara']) {
      await db.query('INSERT INTO expense_splits (id, expenseId, userId, amount) VALUES (?, ?, ?, ?)', [randomUUID(), 'demo-exp-2', uid, 1200]);
    }
    // Exp 3 – Seafood dinner ₹3000, paid by Priya, split 4 ways (₹750 each)
    await db.query('INSERT INTO expenses (id, groupId, description, amount, paidById, category, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['demo-exp-3', 'demo-group-1', 'Seafood dinner', 3000, 'demo-user-priya', 'Food', now, now]);
    for (const uid of ['demo-user-id', 'demo-user-rahul', 'demo-user-priya', 'demo-user-sara']) {
      await db.query('INSERT INTO expense_splits (id, expenseId, userId, amount) VALUES (?, ?, ?, ?)', [randomUUID(), 'demo-exp-3', uid, 750]);
    }

    // ── Group 2: Flat Mates (3 members, ₹7,200 total) ────────────────────────
    await db.query('INSERT INTO groups_table (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)', ['demo-group-2', 'Flat Mates 🏠', now, now]);
    for (const uid of ['demo-user-id', 'demo-user-karan', 'demo-user-sara']) {
      await db.query('INSERT INTO group_members (id, groupId, userId, joinedAt) VALUES (?, ?, ?, ?)', [randomUUID(), 'demo-group-2', uid, now]);
    }
    // Exp 4 – Rent ₹4500, paid by Ankush, split 3 ways (₹1500 each)
    await db.query('INSERT INTO expenses (id, groupId, description, amount, paidById, category, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['demo-exp-4', 'demo-group-2', 'Monthly rent share', 4500, 'demo-user-id', 'Rent', now, now]);
    for (const uid of ['demo-user-id', 'demo-user-karan', 'demo-user-sara']) {
      await db.query('INSERT INTO expense_splits (id, expenseId, userId, amount) VALUES (?, ?, ?, ?)', [randomUUID(), 'demo-exp-4', uid, 1500]);
    }
    // Exp 5 – Electricity ₹1200, paid by Karan, split 3 ways (₹400 each)
    await db.query('INSERT INTO expenses (id, groupId, description, amount, paidById, category, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['demo-exp-5', 'demo-group-2', 'Electricity bill', 1200, 'demo-user-karan', 'Utilities', now, now]);
    for (const uid of ['demo-user-id', 'demo-user-karan', 'demo-user-sara']) {
      await db.query('INSERT INTO expense_splits (id, expenseId, userId, amount) VALUES (?, ?, ?, ?)', [randomUUID(), 'demo-exp-5', uid, 400]);
    }
    // Exp 6 – Groceries ₹1500, paid by Sara, split 3 ways (₹500 each)
    await db.query('INSERT INTO expenses (id, groupId, description, amount, paidById, category, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['demo-exp-6', 'demo-group-2', 'Groceries', 1500, 'demo-user-sara', 'Food', now, now]);
    for (const uid of ['demo-user-id', 'demo-user-karan', 'demo-user-sara']) {
      await db.query('INSERT INTO expense_splits (id, expenseId, userId, amount) VALUES (?, ?, ?, ?)', [randomUUID(), 'demo-exp-6', uid, 500]);
    }

    // ── Group 3: Office Lunch (3 members, ₹3,600 total) ──────────────────────
    await db.query('INSERT INTO groups_table (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)', ['demo-group-3', 'Office Lunch 🍱', now, now]);
    for (const uid of ['demo-user-id', 'demo-user-rahul', 'demo-user-priya']) {
      await db.query('INSERT INTO group_members (id, groupId, userId, joinedAt) VALUES (?, ?, ?, ?)', [randomUUID(), 'demo-group-3', uid, now]);
    }
    // Exp 7 – Monday lunch ₹900, paid by Ankush, split 3 ways (₹300 each)
    await db.query('INSERT INTO expenses (id, groupId, description, amount, paidById, category, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['demo-exp-7', 'demo-group-3', 'Monday team lunch', 900, 'demo-user-id', 'Food', now, now]);
    for (const uid of ['demo-user-id', 'demo-user-rahul', 'demo-user-priya']) {
      await db.query('INSERT INTO expense_splits (id, expenseId, userId, amount) VALUES (?, ?, ?, ?)', [randomUUID(), 'demo-exp-7', uid, 300]);
    }
    // Exp 8 – Biryani ₹1200, paid by Rahul, split 3 ways (₹400 each)
    await db.query('INSERT INTO expenses (id, groupId, description, amount, paidById, category, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['demo-exp-8', 'demo-group-3', 'Wednesday biryani', 1200, 'demo-user-rahul', 'Food', now, now]);
    for (const uid of ['demo-user-id', 'demo-user-rahul', 'demo-user-priya']) {
      await db.query('INSERT INTO expense_splits (id, expenseId, userId, amount) VALUES (?, ?, ?, ?)', [randomUUID(), 'demo-exp-8', uid, 400]);
    }
    // Exp 9 – Desserts ₹1500, paid by Priya, split 3 ways (₹500 each)
    await db.query('INSERT INTO expenses (id, groupId, description, amount, paidById, category, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['demo-exp-9', 'demo-group-3', 'Friday desserts', 1500, 'demo-user-priya', 'Food', now, now]);
    for (const uid of ['demo-user-id', 'demo-user-rahul', 'demo-user-priya']) {
      await db.query('INSERT INTO expense_splits (id, expenseId, userId, amount) VALUES (?, ?, ?, ?)', [randomUUID(), 'demo-exp-9', uid, 500]);
    }

    console.log('✅ Demo seed data inserted successfully.');
  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw error;
  }
};
