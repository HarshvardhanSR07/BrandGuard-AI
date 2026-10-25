/** Ops script: disable an account and kill all its tokens.  npm run user:deactivate -- user3@brandguard.test */
import { loadEnv } from '../config/env';
import { connectDb, disconnectDb } from '../db/connect';
import { User } from '../models';
import { deactivateUser } from '../services/authService';

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error('usage: npm run user:deactivate -- <email>');
  loadEnv();
  await connectDb();
  const user = await User.findOne({ email }).select('_id').lean();
  if (!user) throw new Error('No such user');
  await deactivateUser(String(user._id));
  console.log(`Deactivated ${email}; all existing tokens are now invalid.`);
  await disconnectDb();
}
main().catch(async (e) => {
  console.error(e instanceof Error ? e.message : e);
  await disconnectDb().catch(() => undefined);
  process.exit(1);
});
