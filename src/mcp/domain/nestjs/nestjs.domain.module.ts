import { Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { MikroORMParserStrategy } from './data-access/strategies/mikroorm-parser.strategy';
import { TypeORMParserStrategy } from './data-access/strategies/typeorm-parser.strategy';
import { ObjectionParserStrategy } from './data-access/strategies/objection-parser.strategy';
import { ENTITY_PARSER_STRATEGIES } from './data-access/strategies/entity-parser-strategies.token';
import { ProjectContextService } from './data-access/services/project-context.service';
import { ModuleRegistryService } from './data-access/services/module-registry.service';
import { FrameworkAdapterRegistryService } from './data-access/services/framework-adapter-registry.service';
import { CodebaseAnalyzerService } from './data-access/services/codebase-analyzer.service';
import { EntityIntrospectorService } from './data-access/services/entity-introspector.service';
import { DocumentationReaderService } from './data-access/services/documentation-reader.service';
import { ModuleExplorerTool } from './feature/tools/module-explorer.tool';
import { EntitySchemaTool } from './feature/tools/entity-schema.tool';
import { EndpointListerTool } from './feature/tools/endpoint-lister.tool';
import { ConventionCheckerTool } from './feature/tools/convention-checker.tool';
import { TestInfoTool } from './feature/tools/test-info.tool';
import { OnboardingResource } from './feature/resources/onboarding.resource';
import { ArchitectureResource } from './feature/resources/architecture.resource';
import { ConventionsResource } from './feature/resources/conventions.resource';
import { AuthenticationResource } from './feature/resources/authentication.resource';
import { ModuleDocsResource } from './feature/resources/module-docs.resource';
import { EntityDiagramResource } from './feature/resources/entity-diagram.resource';
import { ModuleEndpointsResource } from './feature/resources/module-endpoints.resource';
import { NewModulePrompt } from './feature/prompts/new-module.prompt';
import { NewEndpointPrompt } from './feature/prompts/new-endpoint.prompt';
import { UpdateDocsPrompt } from './feature/prompts/update-docs.prompt';
import { CodeReviewPrompt } from './feature/prompts/code-review.prompt';
import { InvestigateBugPrompt } from './feature/prompts/investigate-bug.prompt';
import { McpCoreModule } from '@/mcp/core/mcp-core.module';

const MCP_SERVER_NAME = 'alaz-nestjs-mcp';

@Module({
  imports: [
    McpCoreModule,
    McpModule.forFeature(
      [
        ModuleExplorerTool,
        EntitySchemaTool,
        EndpointListerTool,
        ConventionCheckerTool,
        TestInfoTool,
        OnboardingResource,
        ArchitectureResource,
        ConventionsResource,
        AuthenticationResource,
        ModuleDocsResource,
        EntityDiagramResource,
        ModuleEndpointsResource,
        NewModulePrompt,
        NewEndpointPrompt,
        UpdateDocsPrompt,
        CodeReviewPrompt,
        InvestigateBugPrompt,
      ],
      MCP_SERVER_NAME,
    ),
  ],
  providers: [
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
    FrameworkAdapterRegistryService,
    ModuleExplorerTool,
    EntitySchemaTool,
    EndpointListerTool,
    ConventionCheckerTool,
    TestInfoTool,
    OnboardingResource,
    ArchitectureResource,
    ConventionsResource,
    AuthenticationResource,
    ModuleDocsResource,
    EntityDiagramResource,
    ModuleEndpointsResource,
    NewModulePrompt,
    NewEndpointPrompt,
    UpdateDocsPrompt,
    CodeReviewPrompt,
    InvestigateBugPrompt,
  ],
  exports: [
    ProjectContextService,
    ModuleRegistryService,
    DocumentationReaderService,
    EntityIntrospectorService,
    CodebaseAnalyzerService,
    FrameworkAdapterRegistryService,
    ModuleExplorerTool,
    EntitySchemaTool,
    EndpointListerTool,
    ConventionCheckerTool,
    TestInfoTool,
    OnboardingResource,
    ArchitectureResource,
    ConventionsResource,
    AuthenticationResource,
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
export class NestjsDomainModule {}
