/**
 * Describe all demo-relevant tables to check actual column names in the cloud DB.
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const pool = mysql.createPool({ uri: process.env.DATABASE_URL!, connectionLimit: 1 });
  for (const tbl of ['users', 'groups_table', 'group_members', 'expenses', 'expense_splits', 'settlements']) {
    try {
      const [rows] = await pool.query(`DESCRIBE ${tbl}`);
      console.log(`\n=== ${tbl} ===`);
      console.log((rows as any[]).map(r => `  ${r.Field} (${r.Type})`).join('\n'));
    } catch (e: any) {
      console.log(`\n=== ${tbl} ===  NOT FOUND: ${e.message}`);
    }
  }
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
