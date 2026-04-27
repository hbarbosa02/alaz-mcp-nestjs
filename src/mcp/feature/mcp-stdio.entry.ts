import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { McpStdioAppModule } from '@/mcp/feature/stdio-app.module';
import { ProjectRootContextService } from '@/mcp/core/data-access/services/project-root-context.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(McpStdioAppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const projectRoot = app.get(ConfigService).get<string>('PROJECT_ROOT')?.trim();
  if (!projectRoot) {
    console.error(
      'PROJECT_ROOT is required for STDIO mode. Configure env.PROJECT_ROOT in mcp.json (e.g. "${workspaceFolder}").',
    );
    await app.close();
    process.exit(1);
  }

  const projectRootContext = app.get(ProjectRootContextService);
  projectRootContext.enterWith(projectRoot);

  await app.init();
  // Process stays alive via StdioServerTransport (stdin)
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
