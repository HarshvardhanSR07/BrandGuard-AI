/* Architecture rule: only repositories/services/audit/seed may touch Mongoose models.
   Routes MUST go through repositories so workspaceId scoping cannot be forgotten.
   Copy the "overrides" block into the backend's own ESLint config for its routes folder. */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { node: true, es2022: true },
  rules: { '@typescript-eslint/no-explicit-any': 'off' },
  overrides: [
    {
      files: ['src/http/**/*.ts', '**/routes/**/*.ts'],
      rules: {
        'no-restricted-imports': ['error', {
          patterns: [
            { group: ['**/models', '**/models/*', 'mongoose'], message: 'Routes must use repositories, never models or mongoose directly.' },
            { group: ['**/audit/auditLog'], importNames: ['appendAuditEvent'], message: 'Audit events are written only by repositories.' }
          ]
        }]
      }
    }
  ]
};
