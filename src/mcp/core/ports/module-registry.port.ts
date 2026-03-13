import type { ModuleInfo } from './types';

export const MODULE_REGISTRY_PORT = Symbol('IModuleRegistry');

export interface IModuleRegistry {
  listModules(): Promise<ModuleInfo[]>;
  getModule(name: string): Promise<ModuleInfo | null>;
}
