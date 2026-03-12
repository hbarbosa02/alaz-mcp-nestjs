import { Injectable } from '@nestjs/common';
import { FileReaderService } from '@/mcp/util/data-access/services/file-reader.service';
import { ProjectContextService } from '@/mcp/data-access/services/project-context.service';

@Injectable()
export class DocumentationReaderService {
  constructor(
    private readonly fileReader: FileReaderService,
    private readonly projectContext: ProjectContextService,
  ) {}

  async readDoc(relativePath: string): Promise<string | null> {
    return this.fileReader.readFile(relativePath);
  }

  async getArchitectureDocs(): Promise<Record<string, string>> {
    const context = await this.projectContext.getContext();
    const archPath = context.docsLayout.architecture;
    const dirPath = archPath ?? 'docs/architecture';
    const basePath = dirPath.endsWith('/') ? dirPath : `${dirPath}/`;

    const files = await this.fileReader.readDir(dirPath);
    const result: Record<string, string> = {};
    for (const f of files) {
      if (f.endsWith('.md')) {
        const content = await this.fileReader.readFile(`${basePath}${f}`);
        if (content) result[f] = content;
      }
    }
    return result;
  }

  async getFeatureDoc(moduleName: string): Promise<string | null> {
    const candidates = await this.getFeatureDocCandidates(moduleName);

    for (const path of candidates) {
      const content = await this.fileReader.readFile(path);
      if (content) return content;
    }
    return null;
  }

  private async getFeatureDocCandidates(moduleName: string): Promise<string[]> {
    const context = await this.projectContext.getContext();
    const { docsLayout } = context;
    const candidates: string[] = [];

    if (docsLayout.features) {
      const upper = moduleName.toUpperCase().replace(/-/g, '_');
      const kebab = moduleName.replace(/_/g, '-');
      candidates.push(
        `${docsLayout.features}${upper}.md`,
        `${docsLayout.features}${moduleName}.md`,
        `${docsLayout.features}${upper.replace(/_/g, '-')}.md`,
        `${docsLayout.features}${kebab}.md`,
      );
    }

    const upperName = moduleName
      .replace(/-/g, '_')
      .split('_')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('_');
    candidates.push(
      `docs/features/${upperName}.md`,
      `docs/features/${moduleName}.md`,
      `docs/${moduleName}.md`,
      `docs/modules/${moduleName}.md`,
    );

    return candidates;
  }

  async getApiConventions(): Promise<string | null> {
    const context = await this.projectContext.getContext();
    const path = context.docsLayout.conventions;
    if (!path) return null;
    return this.fileReader.readFile(path);
  }

  async getTestingDocs(): Promise<string | null> {
    const context = await this.projectContext.getContext();
    const path = context.docsLayout.testing;
    if (!path) return null;
    return this.fileReader.readFile(path);
  }

  async getChangelog(): Promise<string | null> {
    const context = await this.projectContext.getContext();
    const path = context.docsLayout.changelog;
    if (!path) return null;
    return this.fileReader.readFile(path);
  }

  async getCursorRules(): Promise<Record<string, string>> {
    const files = await this.fileReader.readDir('.cursor/rules');
    const result: Record<string, string> = {};
    for (const f of files) {
      if (f.endsWith('.mdc')) {
        const content = await this.fileReader.readFile(`.cursor/rules/${f}`);
        if (content) result[f] = content;
      }
    }
    return result;
  }

  async getDatabaseEntities(): Promise<string | null> {
    const context = await this.projectContext.getContext();
    const path = context.docsLayout.entities;
    if (!path) return null;
    return this.fileReader.readFile(path);
  }

  async getApiOverview(): Promise<string | null> {
    const context = await this.projectContext.getContext();
    const path = context.docsLayout.apiOverview;
    if (!path) return null;
    return this.fileReader.readFile(path);
  }

  async getReadme(): Promise<string | null> {
    return this.fileReader.readFile('README.md');
  }
}
