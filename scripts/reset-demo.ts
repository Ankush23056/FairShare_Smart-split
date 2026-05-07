/**
 * One-time script: clears all stale demo rows from the cloud DB
 * so the server's seedDemoData() can re-run on next restart.
 *
 * Run with:  npx tsx scripts/reset-demo.ts
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DEMO_USER_IDS  = ['demo-user-id', 'demo-user-rahul', 'demo-user-priya', 'demo-user-sara', 'demo-user-karan'];
const DEMO_GROUP_IDS = ['demo-group-1', 'demo-group-2', 'demo-group-3'];
const DEMO_EXP_IDS   = ['demo-exp-1','demo-exp-2','demo-exp-3','demo-exp-4','demo-exp-5','demo-exp-6','demo-exp-7','demo-exp-8','demo-exp-9'];

const ph = (arr: string[]) => arr.map(() => '?').join(',');

async function resetDemo() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const pool = mysql.createPool({ uri: dbUrl, connectionLimit: 1 });

  console.log('Clearing demo expense_splits...');
  await pool.query(`DELETE FROM expense_splits WHERE expenseId IN (${ph(DEMO_EXP_IDS)})`, DEMO_EXP_IDS);

  console.log('Clearing demo settlements (by payer/payee)...');
  await pool.query(`DELETE FROM settlements WHERE payerId IN (${ph(DEMO_USER_IDS)})`, DEMO_USER_IDS);

  console.log('Clearing demo expenses...');
  await pool.query(`DELETE FROM expenses WHERE groupId IN (${ph(DEMO_GROUP_IDS)})`, DEMO_GROUP_IDS);

  console.log('Clearing demo group_members...');
  await pool.query(`DELETE FROM group_members WHERE groupId IN (${ph(DEMO_GROUP_IDS)})`, DEMO_GROUP_IDS);

  console.log('Clearing demo groups...');
  await pool.query(`DELETE FROM groups_table WHERE id IN (${ph(DEMO_GROUP_IDS)})`, DEMO_GROUP_IDS);

  console.log('Clearing demo users...');
  await pool.query(`DELETE FROM users WHERE id IN (${ph(DEMO_USER_IDS)})`, DEMO_USER_IDS);

  console.log('✅ Demo data cleared. Restart the server to re-seed.');
  await pool.end();
}

resetDemo().catch((err) => { console.error(err); process.exit(1); });
