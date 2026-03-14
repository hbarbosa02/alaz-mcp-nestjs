import { Injectable } from '@nestjs/common';
import { FileReaderService } from '@/mcp/core/data-access/services/file-reader.service';
import type { IModuleRegistry } from '@/mcp/core/ports/module-registry.port';
import type { ModuleInfo } from '@/mcp/core/ports/types';
import {
  ProjectContextService,
  type ModulePattern,
} from '@/mcp/domain/nestjs/data-access/services/project-context.service';

export type { ModuleInfo };

@Injectable()
export class ModuleRegistryService implements IModuleRegistry {
  constructor(
    private readonly fileReader: FileReaderService,
    private readonly projectContext: ProjectContextService,
  ) {}

  async listModules(): Promise<ModuleInfo[]> {
    const context = await this.projectContext.getContext();
    const modules: ModuleInfo[] = [];

    if (context.modulePattern === 'nested') {
      const modulesDirExists = await this.fileReader.exists('src/modules');
      if (modulesDirExists) {
        const moduleDirs = await this.fileReader.readDir('src/modules');
        for (const dir of moduleDirs) {
          if (dir.includes('.')) continue;
          const modulePath = `src/modules/${dir}`;
          const hasModule = await this.hasModuleFile(modulePath, 'nested');
          if (hasModule) {
            const info = await this.getModuleInfo(dir, modulePath);
            modules.push(info);
          }
        }
      }
    } else {
      const srcDirs = await this.fileReader.readDir('src');
      for (const dir of srcDirs) {
        if (dir === 'shared' || dir === 'common') continue;
        const modulePath = `src/${dir}`;
        const hasModule = await this.hasModuleFile(modulePath, context.modulePattern);
        if (!hasModule) continue;

        const info = await this.getModuleInfo(dir, modulePath);
        modules.push(info);
      }

      const sharedInfo = await this.getSharedModuleInfo();
      if (sharedInfo) modules.push(sharedInfo);
    }

    return modules.sort((a, b) => a.name.localeCompare(b.name));
  }

  private async hasModuleFile(modulePath: string, pattern: ModulePattern): Promise<boolean> {
    if (pattern === 'domain-driven') {
      const files = await this.fileReader.readGlob(`${modulePath}/feature/*.module.ts`);
      if (files.length > 0) return true;
    }

    const flatFiles = await this.fileReader.readGlob(`${modulePath}/*.module.ts`);
    if (flatFiles.length > 0) return true;

    const nestedFiles = await this.fileReader.readGlob(`${modulePath}/**/*.module.ts`);
    return nestedFiles.length > 0;
  }

  async getModule(name: string): Promise<ModuleInfo | null> {
    const normalized = name.replace(/_/g, '-');
    const context = await this.projectContext.getContext();

    const candidates: { path: string; name: string }[] = [{ path: `src/${normalized}`, name: normalized }];

    if (context.modulePattern === 'nested') {
      candidates.unshift({
        path: `src/modules/${normalized}`,
        name: normalized,
      });
    }

    for (const { path: modulePath } of candidates) {
      const exists = await this.fileReader.exists(modulePath);
      if (!exists) continue;

      const hasModule = await this.hasModuleFile(modulePath, context.modulePattern);
      if (hasModule) {
        return this.getModuleInfo(normalized, modulePath);
      }
    }

    return null;
  }

  private async getModuleInfo(name: string, modulePath: string): Promise<ModuleInfo> {
    const entityFiles = await this.fileReader.readGlob(`${modulePath}/**/*.entity.ts`);
    const entityNames = entityFiles
      .map((f) => {
        const match = f.match(/([^/]+)\.entity\.ts$/);
        return match ? match[1] : '';
      })
      .filter(Boolean);

    const controllerFiles = await this.fileReader.readGlob(`${modulePath}/**/*.controller.ts`);
    const hasController = controllerFiles.length > 0;

    const specFiles = await this.fileReader.readGlob(`${modulePath}/**/*.spec.ts`);
    const e2eFiles = await this.fileReader.readGlob(`${modulePath}/**/*.e2e-spec.ts`);

    const docPath = await this.findDocPath(name);
    const hasDocumentation = docPath ? await this.fileReader.exists(docPath) : false;

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

  private async findDocPath(name: string): Promise<string | null> {
    const context = await this.projectContext.getContext();
    const { docsLayout } = context;
    const candidates: string[] = [];

    if (docsLayout.features) {
      const upper = name.toUpperCase().replace(/-/g, '_');
      const kebab = name.replace(/_/g, '-');
      candidates.push(
        `${docsLayout.features}${upper}.md`,
        `${docsLayout.features}${name}.md`,
        `${docsLayout.features}${upper.replace(/_/g, '-')}.md`,
        `${docsLayout.features}${kebab}.md`,
      );
    }

    candidates.push(
      `docs/features/${name.toUpperCase().replace(/-/g, '_')}.md`,
      `docs/${name}.md`,
      `docs/modules/${name}.md`,
    );

    for (const candidate of candidates) {
      if (await this.fileReader.exists(candidate)) return candidate;
    }
    return null;
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
