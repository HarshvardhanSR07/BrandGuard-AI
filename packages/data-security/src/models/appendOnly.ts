import type { Schema } from 'mongoose';

const BLOCKED_QUERY_OPS = [
  'updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndReplace', 'replaceOne',
  'deleteOne', 'deleteMany', 'findOneAndDelete',
] as const;

/**
 * Makes a collection append-only AT THE APPLICATION LEVEL: any Mongoose update/delete throws, and saving an
 * existing document throws. This is defence in depth. The real guarantee for audit data is the MongoDB user's
 * privileges (insert + find only on that collection, see docs/DESIGN.md), because raw driver calls bypass hooks.
 */
export function makeAppendOnly(schema: Schema, name: string): void {
  for (const op of BLOCKED_QUERY_OPS) {
    (schema as any).pre(op, function () {
      throw new Error(`${name} is append-only: ${op} is not allowed`);
    });
  }
  (schema as any).pre('deleteOne', { document: true, query: false }, function () {
    throw new Error(`${name} is append-only: delete is not allowed`);
  });
  schema.pre('save', function (next) {
    if (!this.isNew) return next(new Error(`${name} is append-only: existing documents cannot be saved`));
    next();
  });
}
