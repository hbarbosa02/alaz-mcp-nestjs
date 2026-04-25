import { Module } from '@nestjs/common';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { McpCoreModule } from '@/mcp/core/mcp-core.module';
import { MCP_SERVER_VERSION } from '@/mcp/core/mcp-server-package';
import { AngularDomainModule } from '@/mcp/domain/angular/angular.domain.module';
import { NestjsDomainModule } from '@/mcp/domain/nestjs/nestjs.domain.module';
import { LaravelDomainModule } from '@/mcp/domain/laravel/laravel.domain.module';
import { SharedDomainModule } from '@/mcp/domain/shared/shared.domain.module';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'alaz-nestjs-mcp',
      version: MCP_SERVER_VERSION,
      transport: McpTransportType.STDIO,
    }),
    McpCoreModule,
    NestjsDomainModule,
    SharedDomainModule,
    AngularDomainModule,
    LaravelDomainModule,
  ],
})
export class McpStdioModule {}
