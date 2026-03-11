import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from '@/mcp/util/feature/schemas/env.schema';
import { McpStdioModule } from '@/mcp/feature/mcp-stdio.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
    McpStdioModule,
  ],
})
export class McpStdioAppModule {}
