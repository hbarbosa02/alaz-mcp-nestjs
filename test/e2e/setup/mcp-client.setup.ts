import * as path from 'path';

export const PROJECT_ROOT = path.join(__dirname, '../fixtures/sample-project');

export const EXPECTED_TOOLS = [
  'list-modules',
  'get-module-detail',
  'get-entity-schema',
  'list-endpoints',
  'check-conventions',
  'get-recent-changes',
  'get-test-summary',
  'get-create-module-guide',
  'get-create-endpoint-guide',
  'get-update-docs-guide',
  'get-code-review-checklist',
  'get-investigate-bug-guide',
] as const;

export const EXPECTED_STATIC_RESOURCES = [
  'alaz://onboarding',
  'alaz://architecture',
  'alaz://conventions/api',
  'alaz://conventions/testing',
  'alaz://conventions/cqrs',
  'alaz://authentication',
  'alaz://changelog',
];

export const EXPECTED_RESOURCE_TEMPLATES = [
  'alaz://modules/{moduleName}',
  'alaz://entities/{entityName}',
  'alaz://modules/{moduleName}/endpoints',
];

export const EXPECTED_PROMPTS = [
  'create-module',
  'create-endpoint',
  'update-documentation',
  'code-review-checklist',
  'investigate-bug',
];

export function projectRootHeaders(
  projectRoot: string,
): Record<string, string> {
  return {
    'X-Project-Root': projectRoot,
    'Content-Type': 'application/json',
  };
}
