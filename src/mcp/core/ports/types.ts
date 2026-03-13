/**
 * Shared types for framework adapter ports.
 * These represent the contract between tools and domain adapters.
 */

export interface ModuleInfo {
  name: string;
  path: string;
  hasController: boolean;
  hasEntities: boolean;
  entityNames: string[];
  hasTests: boolean;
  hasE2eTests: boolean;
  hasDocumentation: boolean;
  documentationPath: string | null;
  subModules: string[];
}

export interface EntityProperty {
  name: string;
  type: string;
  decorator: string;
  nullable: boolean;
  unique: boolean;
}

export interface EntityRelation {
  name: string;
  type: string;
  targetEntity: string;
  inversedBy?: string;
  mappedBy?: string;
}

export interface EntitySchema {
  name: string;
  tableName: string | null;
  filePath: string;
  properties: EntityProperty[];
  relations: EntityRelation[];
}

export interface EndpointInfo {
  method: string;
  path: string;
  controllerClass: string;
  controllerTag: string;
  permissions: string[];
  authType: string;
  moduleName: string;
}
