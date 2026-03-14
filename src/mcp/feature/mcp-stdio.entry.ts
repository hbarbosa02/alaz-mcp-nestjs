import { NestFactory } from '@nestjs/core';
import { McpStdioAppModule } from '@/mcp/feature/stdio-app.module';
import { ProjectRootContextService } from '@/mcp/core/data-access/services/project-root-context.service';

async function bootstrap(): Promise<void> {
  const projectRoot = process.env.PROJECT_ROOT?.trim();
  if (!projectRoot) {
    console.error(
      'PROJECT_ROOT is required for STDIO mode. Configure env.PROJECT_ROOT in mcp.json (e.g. "${workspaceFolder}").',
    );
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(McpStdioAppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const projectRootContext = app.get(ProjectRootContextService);
  projectRootContext.enterWith(projectRoot);

  await app.init();
  // Process stays alive via StdioServerTransport (stdin)
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
