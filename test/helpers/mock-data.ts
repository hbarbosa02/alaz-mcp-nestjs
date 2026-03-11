import type { ModuleInfo } from '@/mcp/data-access/services/module-registry.service';
import type { EndpointInfo } from '@/mcp/data-access/services/codebase-analyzer.service';
import type { EntitySchema } from '@/mcp/data-access/services/entity-introspector.service';

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
