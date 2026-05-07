import 'dotenv/config';
import mysql from 'mysql2/promise';

async function verify() {
  const pool = mysql.createPool({ uri: process.env.DATABASE_URL!, connectionLimit: 1 });

  const [users]  = await pool.query<any[]>('SELECT id, name, email FROM users WHERE id IN (?, ?, ?, ?, ?)',
    ['demo-user-id', 'demo-user-rahul', 'demo-user-priya', 'demo-user-sara', 'demo-user-karan']);
  const [groups] = await pool.query<any[]>('SELECT id, name FROM groups_table WHERE id IN (?, ?, ?)',
    ['demo-group-1', 'demo-group-2', 'demo-group-3']);
  const [exps]   = await pool.query<any[]>('SELECT id, description, amount FROM expenses WHERE groupId IN (?, ?, ?)',
    ['demo-group-1', 'demo-group-2', 'demo-group-3']);
  const [splits] = await pool.query<any[]>('SELECT COUNT(*) as cnt FROM expense_splits WHERE expenseId IN (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ['demo-exp-1','demo-exp-2','demo-exp-3','demo-exp-4','demo-exp-5','demo-exp-6','demo-exp-7','demo-exp-8','demo-exp-9']);

  console.log('\n👥 Demo Users (' + users.length + '):', (users as any[]).map((u: any) => `${u.name}`).join(', '));
  console.log('🏘️  Demo Groups (' + groups.length + '):', (groups as any[]).map((g: any) => g.name).join(', '));
  console.log('💸 Demo Expenses (' + exps.length + '):', (exps as any[]).map((e: any) => `${e.description} ₹${e.amount}`).join(' | '));
  console.log('✂️  Expense Splits:', (splits[0] as any).cnt);

  await pool.end();
}

verify().catch((e) => { console.error(e); process.exit(1); });
