import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { ProjectRootContextService } from '@/mcp/core/data-access/services/project-root-context.service';

@Injectable()
export class PathResolverService {
  constructor(
    private readonly projectRootContext: ProjectRootContextService,
  ) {}

  resolve(...segments: string[]): string {
    return path.join(this.projectRootContext.getProjectRoot(), ...segments);
  }

  get root(): string {
    return this.projectRootContext.getProjectRoot();
  }
}
