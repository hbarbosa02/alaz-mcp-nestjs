import { Injectable } from '@nestjs/common';
import type { FrameworkType } from '@/mcp/core/data-access/services/framework-detector.service';
import type { IModuleRegistry } from '@/mcp/core/ports/module-registry.port';
import type { IEntityIntrospector } from '@/mcp/core/ports/entity-introspector.port';
import type { ICodebaseAnalyzer } from '@/mcp/core/ports/codebase-analyzer.port';
import type { IDocumentationReader } from '@/mcp/core/ports/documentation-reader.port';
import type { IProjectContext } from '@/mcp/core/ports/project-context.port';
import { ModuleRegistryService } from './module-registry.service';
import { EntityIntrospectorService } from './entity-introspector.service';
import { CodebaseAnalyzerService } from './codebase-analyzer.service';
import { DocumentationReaderService } from './documentation-reader.service';
import { ProjectContextService } from './project-context.service';

export const UNSUPPORTED_FRAMEWORK_MESSAGE =
  'Projeto não parece ser NestJS, Angular ou Laravel. Frameworks suportados: NestJS (implementado), Angular e Laravel (em breve).';

export const FRAMEWORK_COMING_SOON_MESSAGE =
  'Suporte para este framework estará disponível em breve.';

@Injectable()
export class FrameworkAdapterRegistryService {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly entityIntrospector: EntityIntrospectorService,
    private readonly codebaseAnalyzer: CodebaseAnalyzerService,
    private readonly documentationReader: DocumentationReaderService,
    private readonly projectContext: ProjectContextService,
  ) {}

  getModuleRegistry(_framework: FrameworkType): IModuleRegistry | null {
    if (_framework === 'nestjs') return this.moduleRegistry;
    return null;
  }

  getEntityIntrospector(_framework: FrameworkType): IEntityIntrospector | null {
    if (_framework === 'nestjs') return this.entityIntrospector;
    return null;
  }

  getCodebaseAnalyzer(_framework: FrameworkType): ICodebaseAnalyzer | null {
    if (_framework === 'nestjs') return this.codebaseAnalyzer;
    return null;
  }

  getDocumentationReader(
    _framework: FrameworkType,
  ): IDocumentationReader | null {
    if (_framework === 'nestjs') return this.documentationReader;
    return null;
  }

  getProjectContext(_framework: FrameworkType): IProjectContext | null {
    if (_framework === 'nestjs') return this.projectContext;
    return null;
  }

  getUnsupportedMessage(framework: FrameworkType): string | null {
    if (framework === null) return UNSUPPORTED_FRAMEWORK_MESSAGE;
    if (framework === 'angular' || framework === 'laravel')
      return `${framework.charAt(0).toUpperCase() + framework.slice(1)}: ${FRAMEWORK_COMING_SOON_MESSAGE}`;
    return null;
  }
}
