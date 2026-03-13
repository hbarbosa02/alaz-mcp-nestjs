import { Injectable } from '@nestjs/common';
import { FileReaderService } from '@/mcp/core/data-access/services/file-reader.service';

export type FrameworkType = 'nestjs' | 'angular' | 'laravel' | null;

@Injectable()
export class FrameworkDetectorService {
  constructor(private readonly fileReader: FileReaderService) {}

  async detect(): Promise<FrameworkType> {
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
