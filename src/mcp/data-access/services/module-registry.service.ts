import { Injectable } from '@nestjs/common';
import { FileReaderService } from '@/mcp/util/data-access/services/file-reader.service';

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
export class ModuleRegistryService {
  constructor(private readonly fileReader: FileReaderService) {}

  async listModules(): Promise<ModuleInfo[]> {
    const modules: ModuleInfo[] = [];
    const srcDirs = await this.fileReader.readDir('src');

    for (const dir of srcDirs) {
      if (dir === 'shared') continue;
      const modulePath = `src/${dir}`;
      const moduleFiles = await this.fileReader.readGlob(
        `${modulePath}/feature/*.module.ts`,
      );
      if (moduleFiles.length === 0) continue;

      const info = await this.getModuleInfo(dir, modulePath);
      modules.push(info);
    }

    const sharedInfo = await this.getSharedModuleInfo();
    if (sharedInfo) modules.push(sharedInfo);

    return modules.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getModule(name: string): Promise<ModuleInfo | null> {
    const normalized = name.replace(/_/g, '-');
    const modulePath = `src/${normalized}`;

    const exists = await this.fileReader.exists(modulePath);
    if (!exists) return null;

    return this.getModuleInfo(normalized, modulePath);
  }

  private async getModuleInfo(
    name: string,
    modulePath: string,
  ): Promise<ModuleInfo> {
    const entityFiles = await this.fileReader.readGlob(
      `${modulePath}/**/*.entity.ts`,
    );
    const entityNames = entityFiles
      .map((f) => {
        const match = f.match(/([^/]+)\.entity\.ts$/);
        return match ? match[1] : '';
      })
      .filter(Boolean);

    const controllerFiles = await this.fileReader.readGlob(
      `${modulePath}/**/*.controller.ts`,
    );
    const hasController = controllerFiles.length > 0;

    const specFiles = await this.fileReader.readGlob(
      `${modulePath}/**/*.spec.ts`,
    );
    const e2eFiles = await this.fileReader.readGlob(
      `${modulePath}/**/*.e2e-spec.ts`,
    );

    const docPath =
      MODULE_TO_DOC[name] ??
      `docs/features/${name.toUpperCase().replace(/-/g, '_')}.md`;
    const hasDocumentation = await this.fileReader.exists(docPath);

    const subDirs = await this.fileReader.readDir(modulePath);
    const subModules = subDirs.filter((d) => !d.includes('.'));

    return {
      name,
      path: modulePath,
      hasController,
      hasEntities: entityNames.length > 0,
      entityNames,
      hasTests: specFiles.length > 0,
      hasE2eTests: e2eFiles.length > 0,
      hasDocumentation,
      documentationPath: hasDocumentation ? docPath : null,
      subModules,
    };
  }

  private async getSharedModuleInfo(): Promise<ModuleInfo | null> {
    const exists = await this.fileReader.exists('src/shared');
    if (!exists) return null;

    const subDirs = await this.fileReader.readDir('src/shared');
    return {
      name: 'shared',
      path: 'src/shared',
      hasController: false,
      hasEntities: false,
      entityNames: [],
      hasTests: false,
      hasE2eTests: false,
      hasDocumentation: false,
      documentationPath: null,
      subModules: subDirs.filter((d) => !d.includes('.')),
    };
  }
}
