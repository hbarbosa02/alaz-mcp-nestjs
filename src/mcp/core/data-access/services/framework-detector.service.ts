import { Injectable } from '@nestjs/common';
import { FileReaderService } from '@/mcp/core/data-access/services/file-reader.service';
import { ProjectRootContextService } from '@/mcp/core/data-access/services/project-root-context.service';

export type FrameworkType = 'nestjs' | 'angular' | 'laravel' | null;

const CACHE_MAX_SIZE = 10;

@Injectable()
export class FrameworkDetectorService {
  private readonly cache = new Map<string, Promise<FrameworkType>>();

  constructor(
    private readonly fileReader: FileReaderService,
    private readonly projectRootContext: ProjectRootContextService,
  ) {}

  async detect(): Promise<FrameworkType> {
    const root = this.projectRootContext.getProjectRoot();
    let cached = this.cache.get(root);
    if (!cached) {
      this.evictIfNeeded();
      cached = this.detectUncached();
      this.cache.set(root, cached);
    }
    return cached;
  }

  private evictIfNeeded(): void {
    if (this.cache.size >= CACHE_MAX_SIZE) {
      const next = this.cache.keys().next();
      const firstKey: string | undefined = next.done ? undefined : next.value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
  }

  private async detectUncached(): Promise<FrameworkType> {
    const pkg = await this.readPackageJson();
    if (pkg) {
      const deps = {
        ...(pkg.dependencies as Record<string, string>),
        ...(pkg.devDependencies as Record<string, string>),
      };
      if (deps['@nestjs/core']) return 'nestjs';
      if (deps['@angular/core']) return 'angular';
    }

    const composer = await this.readComposerJson();
    if (composer) {
      const require = {
        ...(composer.require as Record<string, string>),
        ...(composer['require-dev'] as Record<string, string>),
      };
      if (require && require['laravel/framework']) return 'laravel';
    }

    return null;
  }

  private async readPackageJson(): Promise<Record<string, unknown> | null> {
    const content = await this.fileReader.readFile('package.json');
    if (!content) return null;
    try {
      return JSON.parse(content) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private async readComposerJson(): Promise<Record<string, unknown> | null> {
    const content = await this.fileReader.readFile('composer.json');
    if (!content) return null;
    try {
      return JSON.parse(content) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
