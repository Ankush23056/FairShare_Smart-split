/**
 * Manually trigger the demo seed (same logic as server startup).
 * Run with: npx tsx scripts/seed-demo.ts
 */
import 'dotenv/config';
import { getDb } from '../server/db.js';

async function main() {
  console.log('Connecting to DB and running seed...');
  const db = await getDb();
  console.log('✅ Done. Check the output above for seed status.');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
