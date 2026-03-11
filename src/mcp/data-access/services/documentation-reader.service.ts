import { Injectable } from '@nestjs/common';
import { FileReaderService } from '@/mcp/util/data-access/services/file-reader.service';

const MODULE_TO_DOC: Record<string, string> = {
  account: 'docs/features/ACCOUNT.md',
  'audit-log': 'docs/features/AUDIT-LOG.md',
  authentication: 'docs/architecture/AUTHENTICATION.md',
  'integration-log': 'docs/features/INTEGRATION-LOG.md',
  mail: 'docs/features/MAIL.md',
  permission: 'docs/features/PERMISSIONS.md',
  'permission-group': 'docs/features/PERMISSIONS.md',
  role: 'docs/features/PERMISSIONS.md',
  storage: 'docs/features/STORAGE.md',
  tenant: 'docs/features/TENANT.md',
  translation: 'docs/features/TRANSLATION.md',
  user: 'docs/features/USER.md',
  profile: 'docs/features/USER.md',
  'job-run': 'docs/architecture/CQRS-AND-JOBS.md',
  queue: 'docs/architecture/CQRS-AND-JOBS.md',
};

@Injectable()
export class DocumentationReaderService {
  constructor(private readonly fileReader: FileReaderService) {}

  async readDoc(relativePath: string): Promise<string | null> {
    return this.fileReader.readFile(relativePath);
  }

  async getArchitectureDocs(): Promise<Record<string, string>> {
    const files = await this.fileReader.readDir('docs/architecture');
    const result: Record<string, string> = {};
    for (const f of files) {
      if (f.endsWith('.md')) {
        const content = await this.fileReader.readFile(
          `docs/architecture/${f}`,
        );
        if (content) result[f] = content;
      }
    }
    return result;
  }

  async getFeatureDoc(moduleName: string): Promise<string | null> {
    const path = MODULE_TO_DOC[moduleName];
    if (path) return this.fileReader.readFile(path);

    const upperName = moduleName
      .replace(/-/g, '_')
      .split('_')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('_');
    return this.fileReader.readFile(`docs/features/${upperName}.md`);
  }

  async getApiConventions(): Promise<string | null> {
    return this.fileReader.readFile('docs/api/API-CONVENTIONS.md');
  }

  async getTestingDocs(): Promise<string | null> {
    return this.fileReader.readFile('docs/tests/README-TESTS.md');
  }

  async getChangelog(): Promise<string | null> {
    return this.fileReader.readFile('docs/changes/4 - Changelog.md');
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
    return this.fileReader.readFile('docs/diagrams/DATABASE-ENTITIES.md');
  }

  async getApiOverview(): Promise<string | null> {
    return this.fileReader.readFile('docs/architecture/API-OVERVIEW.md');
  }

  async getReadme(): Promise<string | null> {
    return this.fileReader.readFile('README.md');
  }
}
