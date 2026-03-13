import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { CodebaseAnalyzerService } from '@/mcp/data-access/services/codebase-analyzer.service';
import {
  ENTITY_PARSER_STRATEGIES,
  MikroORMParserStrategy,
  ObjectionParserStrategy,
  TypeORMParserStrategy,
} from '@/mcp/data-access/strategies';
import { DocumentationReaderService } from '@/mcp/data-access/services/documentation-reader.service';
import { EntityIntrospectorService } from '@/mcp/data-access/services/entity-introspector.service';
import { GitChangelogService } from '@/mcp/data-access/services/git-changelog.service';
import { GitContextService } from '@/mcp/data-access/services/git-context.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';
import { ModuleRegistryService } from '@/mcp/data-access/services/module-registry.service';
import { ProjectContextService } from '@/mcp/data-access/services/project-context.service';
import { ProjectRootContextService } from '@/mcp/data-access/services/project-root-context.service';
import { FileReaderService } from '@/mcp/util/data-access/services/file-reader.service';
import { PathResolverService } from '@/mcp/util/data-access/services/path-resolver.service';
import { AuthenticationResource } from '@/mcp/feature/resources/authentication.resource';
import { ArchitectureResource } from '@/mcp/feature/resources/architecture.resource';
import { ChangelogResource } from '@/mcp/feature/resources/changelog.resource';
import { ConventionsResource } from '@/mcp/feature/resources/conventions.resource';
import { EntityDiagramResource } from '@/mcp/feature/resources/entity-diagram.resource';
import { ModuleDocsResource } from '@/mcp/feature/resources/module-docs.resource';
import { ModuleEndpointsResource } from '@/mcp/feature/resources/module-endpoints.resource';
import { OnboardingResource } from '@/mcp/feature/resources/onboarding.resource';
import { CodeReviewPrompt } from '@/mcp/feature/prompts/code-review.prompt';
import { InvestigateBugPrompt } from '@/mcp/feature/prompts/investigate-bug.prompt';
import { NewEndpointPrompt } from '@/mcp/feature/prompts/new-endpoint.prompt';
import { NewModulePrompt } from '@/mcp/feature/prompts/new-module.prompt';
import { UpdateDocsPrompt } from '@/mcp/feature/prompts/update-docs.prompt';
import { ConventionCheckerTool } from '@/mcp/feature/tools/convention-checker.tool';
import { EndpointListerTool } from '@/mcp/feature/tools/endpoint-lister.tool';
import { EntitySchemaTool } from '@/mcp/feature/tools/entity-schema.tool';
import { ModuleExplorerTool } from '@/mcp/feature/tools/module-explorer.tool';
import { RecentChangesTool } from '@/mcp/feature/tools/recent-changes.tool';
import { TestInfoTool } from '@/mcp/feature/tools/test-info.tool';
import { ProjectRootMiddleware } from '@/mcp/feature/middleware/project-root.middleware';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'alaz-nestjs-mcp',
      version: '1.0.0',
      transport: [McpTransportType.STREAMABLE_HTTP, McpTransportType.SSE],
    }),
  ],
  providers: [
    ProjectRootContextService,
    ProjectRootMiddleware,
    McpLoggerService,
    PathResolverService,
    FileReaderService,
    ProjectContextService,
    MikroORMParserStrategy,
    TypeORMParserStrategy,
    ObjectionParserStrategy,
    {
      provide: ENTITY_PARSER_STRATEGIES,
      useFactory: (
        mikro: MikroORMParserStrategy,
        type: TypeORMParserStrategy,
        objection: ObjectionParserStrategy,
      ) => [mikro, type, objection],
      inject: [
        MikroORMParserStrategy,
        TypeORMParserStrategy,
        ObjectionParserStrategy,
      ],
    },
    ModuleRegistryService,
    DocumentationReaderService,
    EntityIntrospectorService,
    CodebaseAnalyzerService,
    GitContextService,
    GitChangelogService,
    ModuleExplorerTool,
    EntitySchemaTool,
    EndpointListerTool,
    ConventionCheckerTool,
    RecentChangesTool,
    TestInfoTool,
    OnboardingResource,
    ArchitectureResource,
    ConventionsResource,
    AuthenticationResource,
    ChangelogResource,
    ModuleDocsResource,
    EntityDiagramResource,
    ModuleEndpointsResource,
    NewModulePrompt,
    NewEndpointPrompt,
    UpdateDocsPrompt,
    CodeReviewPrompt,
    InvestigateBugPrompt,
  ],
})
export class McpNestjsModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(ProjectRootMiddleware)
      .forRoutes({ path: 'mcp', method: RequestMethod.ALL });
  }
}
