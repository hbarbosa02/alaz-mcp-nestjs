export const DOCUMENTATION_READER_PORT = Symbol('IDocumentationReader');

export interface IDocumentationReader {
  getFeatureDoc(moduleName: string): Promise<string | null>;
  getArchitectureDocs(): Promise<Record<string, string>>;
  getApiConventions(): Promise<string | null>;
  getReadme(): Promise<string | null>;
}
