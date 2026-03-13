import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { McpCoreModule } from '@/mcp/core/mcp-core.module';
import { NestjsDomainModule } from '@/mcp/domain/nestjs/nestjs.domain.module';
import { SharedDomainModule } from '@/mcp/domain/shared/shared.domain.module';
import { ProjectRootMiddleware } from '@/mcp/core/feature/middleware/project-root.middleware';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'alaz-nestjs-mcp',
      version: '1.0.0',
      transport: [McpTransportType.STREAMABLE_HTTP, McpTransportType.SSE],
      streamableHttp: {
        statelessMode: false,
      },
    }),
    McpCoreModule,
    NestjsDomainModule,
    SharedDomainModule,
  ],
})
export class McpNestjsModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(ProjectRootMiddleware)
      .forRoutes(
        { path: 'mcp', method: RequestMethod.ALL },
        { path: 'sse', method: RequestMethod.ALL },
        { path: 'messages', method: RequestMethod.ALL },
      );
  }
}
