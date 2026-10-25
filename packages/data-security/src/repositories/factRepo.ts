import { ApprovedFact } from '../models';
import { factBody } from '../validation/schemas';
import { createVersionedRepo } from './versionedRepo';

export const factRepo = createVersionedRepo({
  Model: ApprovedFact,
  keyField: 'factKey',
  readAction: 'fact:read',
  manageAction: 'fact:manage',
  targetType: 'fact',
  auditCreated: 'fact.created',
  auditRetired: 'fact.retired',
  parse: (i) => factBody.parse(i),
});
