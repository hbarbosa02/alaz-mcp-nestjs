import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AsyncLocalStorage } from 'async_hooks';

const PROJECT_ROOT_REQUIRED =
  'Project root is required. Configure env.PROJECT_ROOT (STDIO) or headers["X-Project-Root"] (HTTP) in mcp.json.';

/**
 * Per-request root for HTTP (`X-Project-Root` + ALS), with a validated env default
 * (`ConfigService` / `PROJECT_ROOT`) when ALS is missing — e.g. MCP callbacks off the
 * request async chain in STDIO, or the same class of edge cases under HTTP (AD-007).
 */
@Injectable()
export class ProjectRootContextService {
  private readonly storage = new AsyncLocalStorage<string>();

  constructor(private readonly configService: ConfigService) {}

  run<T>(projectRoot: string, fn: () => T): T {
    const trimmed = projectRoot?.trim();
    if (!trimmed) {
      throw new Error(PROJECT_ROOT_REQUIRED);
    }
    return this.storage.run(trimmed, fn);
  }

  getProjectRoot(): string {
    const fromStorage = this.storage.getStore();
    if (fromStorage) return fromStorage;

    const fromConfig = this.configService.get<string>('PROJECT_ROOT')?.trim();
    if (fromConfig) return fromConfig;

    throw new Error(PROJECT_ROOT_REQUIRED);
  }

  /**
   * Sets default ALS store for the process (STDIO bootstrap). HTTP must rely on
   * per-request `run()` in middleware only — avoid `enterWith` on HTTP (multi-tenant roots).
   */
  enterWith(projectRoot: string): void {
    const trimmed = projectRoot?.trim();
    if (!trimmed) {
      throw new Error(PROJECT_ROOT_REQUIRED);
    }
    this.storage.enterWith(trimmed);
  }
}
