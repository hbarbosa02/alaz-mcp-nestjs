import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3100;
  await app.listen(port);
  // eslint-disable-next-line no-console -- startup banner
  console.log(`Alaz MCP Server running on http://localhost:${port}`);
  // eslint-disable-next-line no-console -- startup banner
  console.log(`MCP endpoint: http://localhost:${port}/mcp`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console -- error handler
  console.error(err);
  process.exit(1);
});
