import { Injectable } from '@nestjs/common';
import { FileReaderService } from '@/mcp/core/data-access/services/file-reader.service';

export type ModulePattern = 'domain-driven' | 'flat' | 'nested';

export type OrmType = 'mikroorm' | 'typeorm' | 'objection' | null;

export type ValidationLibrary = 'nestjs-zod' | 'class-validator' | null;

export type TestFramework = 'jest' | 'vitest' | null;

export interface ProjectStack {
  nestVersion: string | null;
  orm: OrmType;
  database: string | null;
  redis: boolean;
  bullmq: boolean;
  validation: ValidationLibrary;
  testFramework: TestFramework;
  testFrameworkVersion: string | null;
  packageScripts: Record<string, string>;
}

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
  orm: OrmType;
  stack: ProjectStack;
  validationLibrary: ValidationLibrary;
  testFramework: TestFramework;
}

@Injectable()
export class ProjectContextService {
  private context: ProjectContext | null = null;
  private packageJsonPromise: Promise<Record<string, unknown> | null> | null =
    null;

  constructor(private readonly fileReader: FileReaderService) {}

  async getContext(): Promise<ProjectContext> {
    if (!this.context) {
      this.context = await this.detectContext();
    }
    return this.context;
  }

  private getPackageJson(): Promise<Record<string, unknown> | null> {
    if (!this.packageJsonPromise) {
      this.packageJsonPromise = this.fileReader
        .readFile('package.json')
        .then((content) => {
          if (!content) return null;
          try {
            return JSON.parse(content) as Record<string, unknown>;
          } catch {
            return null;
          }
        });
    }
    return this.packageJsonPromise;
  }

  private async detectContext(): Promise<ProjectContext> {
    const [
      name,
      modulePattern,
      hasDocsDir,
      docsLayout,
      customExceptionClass,
      pathAliases,
      stack,
    ] = await Promise.all([
      this.detectProjectName(),
      this.detectModulePattern(),
      this.detectHasDocsDir(),
      this.detectDocsLayout(),
      this.detectCustomExceptionClass(),
      this.detectPathAliases(),
      this.detectStack(),
    ]);

    return {
      name,
      modulePattern,
      hasDocsDir,
      docsLayout,
      customExceptionClass,
      pathAliases,
      orm: stack.orm,
      stack,
      validationLibrary: stack.validation,
      testFramework: stack.testFramework,
    };
  }

  private async detectProjectName(): Promise<string> {
    const pkg = await this.getPackageJson();
    if (!pkg || typeof pkg.name !== 'string') return 'NestJS Project';
    return pkg.name;
  }

  private async detectStack(): Promise<ProjectStack> {
    const pkg = await this.getPackageJson();
    const deps = pkg
      ? ({
          ...(pkg.dependencies as Record<string, string>),
          ...(pkg.devDependencies as Record<string, string>),
        } as Record<string, string>)
      : {};
    const scripts = (pkg?.scripts as Record<string, string>) ?? {};

    if (!deps || typeof deps !== 'object') {
      return this.emptyStack();
    }

    const nestPkg = deps['@nestjs/core'] ?? deps['@nestjs/common'];
    const nestVersion = nestPkg
      ? String(nestPkg)
          .replace(/^[\^~]/, '')
          .split('.')[0]
      : null;

    const hasMikroORM = Object.keys(deps).some(
      (k) => k === 'mikro-orm' || k.startsWith('@mikro-orm/'),
    );
    const hasTypeORM = Object.keys(deps).includes('typeorm');
    const hasObjection = Object.keys(deps).includes('objection');
    let orm: OrmType = null;
    if (hasMikroORM) orm = 'mikroorm';
    else if (hasTypeORM) orm = 'typeorm';
    else if (hasObjection) orm = 'objection';

    let database: string | null = null;
    if (deps['pg']) database = 'PostgreSQL';
    else if (deps['mysql2']) database = 'MySQL';
    else if (deps['mongodb']) database = 'MongoDB';
    else if (deps['better-sqlite3']) database = 'SQLite';

    const redis = Object.keys(deps).some(
      (k) => k === 'redis' || k === 'ioredis',
    );
    const bullmq = Object.keys(deps).includes('bullmq');

    let validation: ValidationLibrary = null;
    if (deps['nestjs-zod']) validation = 'nestjs-zod';
    else if (deps['class-validator']) validation = 'class-validator';

    let testFramework: TestFramework = null;
    let testFrameworkVersion: string | null = null;
    if (deps['jest']) {
      testFramework = 'jest';
      testFrameworkVersion = deps['jest'] ?? null;
    } else if (deps['vitest']) {
      testFramework = 'vitest';
      testFrameworkVersion = deps['vitest'] ?? null;
    }

    return {
      nestVersion,
      orm,
      database,
      redis,
      bullmq,
      validation,
      testFramework,
      testFrameworkVersion,
      packageScripts: typeof scripts === 'object' ? scripts : {},
    };
  }

  private emptyStack(): ProjectStack {
    return {
      nestVersion: null,
      orm: null,
      database: null,
      redis: false,
      bullmq: false,
      validation: null,
      testFramework: null,
      testFrameworkVersion: null,
      packageScripts: {},
    };
  }

  private async detectModulePattern(): Promise<ModulePattern> {
    // Check domain-driven: src/*/feature/*.module.ts
    const domainDrivenFiles = await this.fileReader.readGlob(
      'src/*/feature/*.module.ts',
    );
    if (domainDrivenFiles.length > 0) return 'domain-driven';

    // Check nested: src/modules/*/*.module.ts
    const nestedFiles = await this.fileReader.readGlob(
      'src/modules/*/*.module.ts',
    );
    if (nestedFiles.length > 0) return 'nested';

    // Default to flat: src/*/*.module.ts or src/*/**/*.module.ts
    return 'flat';
  }

  private async detectHasDocsDir(): Promise<boolean> {
    return this.fileReader.exists('docs');
  }

  private async detectDocsLayout(): Promise<DocsLayout> {
    const layout: DocsLayout = {
      features: null,
      architecture: null,
      changelog: null,
      conventions: null,
      testing: null,
      entities: null,
      apiOverview: null,
    };

    // Changelog candidates
    const changelogCandidates = [
      'CHANGELOG.md',
      'docs/CHANGELOG.md',
      'docs/changes/4 - Changelog.md',
    ];
    const changelogFiles = await this.fileReader.readGlob('docs/changes/*.md');
    for (const c of changelogCandidates) {
      if (await this.fileReader.exists(c)) {
        layout.changelog = c;
        break;
      }
    }
    if (!layout.changelog && changelogFiles.length > 0) {
      layout.changelog = changelogFiles[0];
    }

    // Features directory
    if (await this.fileReader.exists('docs/features')) {
      layout.features = 'docs/features/';
    } else if (await this.fileReader.exists('docs/modules')) {
      layout.features = 'docs/modules/';
    }

    // Architecture directory
    if (await this.fileReader.exists('docs/architecture')) {
      layout.architecture = 'docs/architecture/';
    } else if (await this.fileReader.exists('docs')) {
      layout.architecture = 'docs/';
    }

    // Conventions
    const conventionCandidates = [
      'docs/api/API-CONVENTIONS.md',
      'docs/CONVENTIONS.md',
      'docs/api/conventions.md',
      'docs/conventions.md',
    ];
    for (const c of conventionCandidates) {
      if (await this.fileReader.exists(c)) {
        layout.conventions = c;
        break;
      }
    }

    // Testing
    const testingCandidates = [
      'docs/tests/README-TESTS.md',
      'docs/TESTING.md',
      'docs/tests/README.md',
      'docs/testing.md',
    ];
    for (const c of testingCandidates) {
      if (await this.fileReader.exists(c)) {
        layout.testing = c;
        break;
      }
    }

    // Entities
    const entitiesCandidates = [
      'docs/diagrams/DATABASE-ENTITIES.md',
      'docs/entities.md',
      'docs/database.md',
      'docs/DATABASE.md',
    ];
    for (const c of entitiesCandidates) {
      if (await this.fileReader.exists(c)) {
        layout.entities = c;
        break;
      }
    }

    // API Overview
    const apiOverviewCandidates = [
      'docs/architecture/API-OVERVIEW.md',
      'docs/API.md',
      'docs/README.md',
      'docs/architecture/README.md',
    ];
    for (const c of apiOverviewCandidates) {
      if (await this.fileReader.exists(c)) {
        layout.apiOverview = c;
        break;
      }
    }

    return layout;
  }

  private async detectCustomExceptionClass(): Promise<string | null> {
    const sharedFiles = await this.fileReader.readGlob('src/shared/**/*.ts');
    const commonFiles = await this.fileReader.readGlob('src/common/**/*.ts');
    const allFiles = [...sharedFiles, ...commonFiles];

    for (const filePath of allFiles) {
      const content = await this.fileReader.readFile(filePath);
      if (!content) continue;
      const match = content.match(
        /export\s+class\s+(\w+)\s+extends\s+(?:.*?)?HttpException/,
      );
      if (match && match[1] !== 'HttpException') {
        return match[1];
      }
    }
    return null;
  }

  private async detectPathAliases(): Promise<Record<string, string>> {
    const content = await this.fileReader.readFile('tsconfig.json');
    if (!content) return {};
    try {
      const tsconfig = JSON.parse(content) as {
        compilerOptions?: { paths?: Record<string, string> };
      };
      const paths = tsconfig.compilerOptions?.paths;
      if (!paths || typeof paths !== 'object') return {};
      return paths;
    } catch {
      return {};
    }
  }
}
