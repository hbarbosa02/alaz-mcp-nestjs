import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from '@/mcp/util/feature/schemas/env.schema';
import { McpNestjsModule } from '@/mcp/feature/mcp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
    McpNestjsModule,
  ],
})
export class AppModule {}
