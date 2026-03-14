import type { EndpointInfo } from '@mcp/core/ports/types';

export const CODEBASE_ANALYZER_PORT = Symbol('ICodebaseAnalyzer');

export interface ICodebaseAnalyzer {
  getEndpoints(moduleName?: string): Promise<EndpointInfo[]>;
  getModuleEndpoints(moduleName: string): Promise<EndpointInfo[]>;
}
