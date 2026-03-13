export const DOCUMENTATION_READER_PORT = Symbol('IDocumentationReader');

export interface IDocumentationReader {
  getFeatureDoc(moduleName: string): Promise<string | null>;
  getArchitectureDocs(): Promise<Record<string, string>>;
  getApiConventions(): Promise<string | null>;
  getReadme(): Promise<string | null>;
  /** API overview doc (e.g. docs/architecture/API-OVERVIEW.md) */
  getApiOverview(): Promise<string | null>;
  /** Cursor rules from .cursor/rules/ */
  getCursorRules(): Promise<Record<string, string>>;
  /** Testing conventions doc */
  getTestingDocs(): Promise<string | null>;
  /** Read doc at relative path */
  readDoc(relativePath: string): Promise<string | null>;
  /** Changelog doc (e.g. docs/changes/4 - Changelog.md) */
  getChangelog(): Promise<string | null>;
}
