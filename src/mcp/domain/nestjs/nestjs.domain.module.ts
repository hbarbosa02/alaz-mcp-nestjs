import { Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { MikroORMParserStrategy } from '@mcp/domain/nestjs/data-access/strategies/mikroorm-parser.strategy';
import { TypeORMParserStrategy } from '@mcp/domain/nestjs/data-access/strategies/typeorm-parser.strategy';
import { ObjectionParserStrategy } from '@mcp/domain/nestjs/data-access/strategies/objection-parser.strategy';
import { ENTITY_PARSER_STRATEGIES } from '@mcp/domain/nestjs/data-access/strategies/entity-parser-strategies.token';
import { ProjectContextService } from '@mcp/domain/nestjs/data-access/services/project-context.service';
import { ModuleRegistryService } from '@mcp/domain/nestjs/data-access/services/module-registry.service';
import { FrameworkAdapterRegistryService } from '@mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { CodebaseAnalyzerService } from '@mcp/domain/nestjs/data-access/services/codebase-analyzer.service';
import { EntityIntrospectorService } from '@mcp/domain/nestjs/data-access/services/entity-introspector.service';
import { DocumentationReaderService } from '@mcp/domain/nestjs/data-access/services/documentation-reader.service';
import { ModuleExplorerTool } from '@mcp/domain/nestjs/feature/tools/module-explorer.tool';
import { EntitySchemaTool } from '@mcp/domain/nestjs/feature/tools/entity-schema.tool';
import { EndpointListerTool } from '@mcp/domain/nestjs/feature/tools/endpoint-lister.tool';
import { ConventionCheckerTool } from '@mcp/domain/nestjs/feature/tools/convention-checker.tool';
import { TestInfoTool } from '@mcp/domain/nestjs/feature/tools/test-info.tool';
import { PromptGuideTools } from '@mcp/domain/nestjs/feature/tools/prompt-guide.tools';
import { OnboardingResource } from '@mcp/domain/nestjs/feature/resources/onboarding.resource';
import { ArchitectureResource } from '@mcp/domain/nestjs/feature/resources/architecture.resource';
import { ConventionsResource } from '@mcp/domain/nestjs/feature/resources/conventions.resource';
import { AuthenticationResource } from '@mcp/domain/nestjs/feature/resources/authentication.resource';
import { ModuleDocsResource } from '@mcp/domain/nestjs/feature/resources/module-docs.resource';
import { EntityDiagramResource } from '@mcp/domain/nestjs/feature/resources/entity-diagram.resource';
import { ModuleEndpointsResource } from '@mcp/domain/nestjs/feature/resources/module-endpoints.resource';
import { NewModulePrompt } from '@mcp/domain/nestjs/feature/prompts/new-module.prompt';
import { NewEndpointPrompt } from '@mcp/domain/nestjs/feature/prompts/new-endpoint.prompt';
import { UpdateDocsPrompt } from '@mcp/domain/nestjs/feature/prompts/update-docs.prompt';
import { CodeReviewPrompt } from '@mcp/domain/nestjs/feature/prompts/code-review.prompt';
import { InvestigateBugPrompt } from '@mcp/domain/nestjs/feature/prompts/investigate-bug.prompt';
import { McpCoreModule } from '@mcp/core/mcp-core.module';

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
        PromptGuideTools,
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
      useFactory: (mikro: MikroORMParserStrategy, type: TypeORMParserStrategy, objection: ObjectionParserStrategy) => [
        mikro,
        type,
        objection,
      ],
      inject: [MikroORMParserStrategy, TypeORMParserStrategy, ObjectionParserStrategy],
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
    PromptGuideTools,
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
    PromptGuideTools,
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
