import { Policy } from '../models';
import { policyBody } from '../validation/schemas';
import { createVersionedRepo } from './versionedRepo';

export const policyRepo = createVersionedRepo({
  Model: Policy,
  keyField: 'ruleKey',
  readAction: 'policy:read',
  manageAction: 'policy:manage',
  targetType: 'policy',
  auditCreated: 'policy.created',
  auditRetired: 'policy.retired',
  parse: (i) => policyBody.parse(i),
});
