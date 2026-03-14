import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3100;
  await app.listen(port);
  console.log(`Alaz MCP Server running on http://localhost:${port}`);
  console.log(`MCP endpoint: http://localhost:${port}/mcp`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
