import type { ModuleInfo } from '@/mcp/data-access/services/module-registry.service';
import type { EndpointInfo } from '@/mcp/data-access/services/codebase-analyzer.service';
import type { EntitySchema } from '@/mcp/data-access/services/entity-introspector.service';
import type {
  ProjectContext,
  ProjectStack,
} from '@/mcp/data-access/services/project-context.service';

const defaultStack: ProjectStack = {
  nestVersion: null,
  orm: null,
  database: null,
  redis: false,
  bullmq: false,
  validation: null,
  testFramework: null,
  testFrameworkVersion: null,
  packageScripts: {},
};

export function createProjectContext(
  overrides: Partial<ProjectContext> = {},
): ProjectContext {
  const base = {
    name: 'test-project',
    modulePattern: 'domain-driven' as const,
    hasDocsDir: true,
    docsLayout: {
      features: 'docs/features/',
      architecture: 'docs/architecture/',
      changelog: 'docs/changes/4 - Changelog.md',
      conventions: 'docs/api/API-CONVENTIONS.md',
      testing: 'docs/tests/README-TESTS.md',
      entities: 'docs/diagrams/DATABASE-ENTITIES.md',
      apiOverview: 'docs/architecture/API-OVERVIEW.md',
    },
    customExceptionClass: null,
    pathAliases: {},
    orm: null,
    stack: { ...defaultStack },
    validationLibrary: null,
    testFramework: null,
  };
  const merged = { ...base, ...overrides };
  if (overrides.orm !== undefined) {
    merged.stack = { ...merged.stack, orm: overrides.orm };
  }
  if (overrides.validationLibrary !== undefined) {
    merged.stack = { ...merged.stack, validation: overrides.validationLibrary };
  }
  if (overrides.testFramework !== undefined) {
    merged.stack = { ...merged.stack, testFramework: overrides.testFramework };
  }
  return merged;
}

export function createModuleInfo(
  overrides: Partial<ModuleInfo> = {},
): ModuleInfo {
  return {
    name: 'user',
    path: 'src/user',
    hasController: true,
    hasEntities: true,
    hasTests: true,
    hasE2eTests: false,
    hasDocumentation: true,
    documentationPath: 'docs/features/USER.md',
    entityNames: ['User'],
    subModules: ['feature'],
    ...overrides,
  };
}

export function createEndpointInfo(
  overrides: Partial<EndpointInfo> = {},
): EndpointInfo {
  return {
    method: 'GET',
    path: '/user',
    controllerClass: 'UserController',
    controllerTag: 'user',
    moduleName: 'user',
    permissions: ['ListUsers'],
    authType: 'Bearer',
    ...overrides,
  };
}

export function createEntitySchema(
  overrides: Partial<EntitySchema> = {},
): EntitySchema {
  return {
    name: 'User',
    filePath: 'src/user/user.entity.ts',
    tableName: 'user',
    properties: [
      {
        name: 'id',
        type: 'number',
        decorator: '@Property',
        nullable: false,
        unique: true,
      },
    ],
    relations: [
      {
        name: 'tenant',
        type: 'ManyToOne',
        targetEntity: 'Tenant',
        inversedBy: undefined,
        mappedBy: undefined,
      },
    ],
    ...overrides,
  };
}
