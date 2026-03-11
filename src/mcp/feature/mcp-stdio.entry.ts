import { NestFactory } from '@nestjs/core';
import { McpStdioAppModule } from '@/mcp/feature/stdio-app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(McpStdioAppModule, {
    logger: ['log', 'error', 'warn'],
  });

  await app.init();
  // Process stays alive via StdioServerTransport (stdin)
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console -- error handler
  console.error(err);
  process.exit(1);
});
