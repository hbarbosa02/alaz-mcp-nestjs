import type { EntitySchema } from '@mcp/core/ports/types';

export type OrmType = 'mikroorm' | 'typeorm' | 'objection';

export const ENTITY_INTROSPECTOR_PORT = Symbol('IEntityIntrospector');

export interface IEntityIntrospector {
  listEntities(ormOverride?: OrmType): Promise<EntitySchema[]>;
  getEntitySchema(entityName: string, ormOverride?: OrmType): Promise<EntitySchema | null>;
}
