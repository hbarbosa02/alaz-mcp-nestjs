export type ModulePattern = 'domain-driven' | 'flat' | 'nested';

export interface DocsLayout {
  features: string | null;
  architecture: string | null;
  changelog: string | null;
  conventions: string | null;
  testing: string | null;
  entities: string | null;
  apiOverview: string | null;
}

export interface ProjectContext {
  name: string;
  modulePattern: ModulePattern;
  hasDocsDir: boolean;
  docsLayout: DocsLayout;
  customExceptionClass: string | null;
  pathAliases: Record<string, string>;
  orm: 'mikroorm' | 'typeorm' | 'objection' | null;
  stack: unknown;
  validationLibrary: string | null;
  testFramework: string | null;
}

export const PROJECT_CONTEXT_PORT = Symbol('IProjectContext');

export interface IProjectContext {
  getContext(): Promise<ProjectContext>;
}
