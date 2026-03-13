import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

const PROJECT_ROOT_REQUIRED =
  'Project root is required. Configure env.PROJECT_ROOT (STDIO) or headers["X-Project-Root"] (HTTP) in mcp.json.';

@Injectable()
export class ProjectRootContextService {
  private readonly storage = new AsyncLocalStorage<string>();

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

    throw new Error(PROJECT_ROOT_REQUIRED);
  }

  /**
   * Sets project root for the remainder of the process (STDIO bootstrap).
   * Call once at startup when process.env.PROJECT_ROOT is set. Do not use for HTTP.
   */
  enterWith(projectRoot: string): void {
    const trimmed = projectRoot?.trim();
    if (!trimmed) {
      throw new Error(PROJECT_ROOT_REQUIRED);
    }
    this.storage.enterWith(trimmed);
  }
}
