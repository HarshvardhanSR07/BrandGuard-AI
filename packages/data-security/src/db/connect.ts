import mongoose from 'mongoose';
import { getEnv } from '../config/env';
import '../models'; // register every model so init() below builds all indexes

/**
 * Global Mongoose safety switches. They MUST be set before any model is used, so index.ts imports this first.
 *  - sanitizeFilter: a query value like {"$ne": null} is wrapped in $eq instead of being executed (NoSQL operator injection).
 *    Consequence: our own operators must be marked with mongoose.trusted() (see repositories/common.ts).
 *  - strictQuery 'throw': a filter on an unknown field throws instead of being silently dropped. A silently dropped
 *    "workspaceId" filter would be a cross-tenant leak.
 */
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', 'throw');

export async function connectDb(uri: string = getEnv().MONGODB_URI): Promise<typeof mongoose> {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  // Wait for index builds so unique indexes (membership, audit seq, ...) are enforced before serving traffic.
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  return mongoose;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
