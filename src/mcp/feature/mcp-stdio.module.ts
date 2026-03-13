import { Module } from '@nestjs/common';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { McpCoreModule } from '@/mcp/core/mcp-core.module';
import { NestjsDomainModule } from '@/mcp/domain/nestjs/nestjs.domain.module';
import { SharedDomainModule } from '@/mcp/domain/shared/shared.domain.module';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'alaz-nestjs-mcp',
      version: '1.0.0',
      transport: McpTransportType.STDIO,
    }),
    McpCoreModule,
    NestjsDomainModule,
    SharedDomainModule,
  ],
})
export class McpStdioModule {}
