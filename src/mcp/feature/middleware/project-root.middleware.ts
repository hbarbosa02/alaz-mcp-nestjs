import {
  Injectable,
  NestMiddleware,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ProjectRootContextService } from '@/mcp/data-access/services/project-root-context.service';

const HEADER = 'x-project-root';

@Injectable()
export class ProjectRootMiddleware implements NestMiddleware {
  constructor(
    private readonly projectRootContext: ProjectRootContextService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const projectRoot = req.headers[HEADER] as string | undefined;
    const trimmed = projectRoot?.trim();

    if (!trimmed) {
      res.status(HttpStatus.BAD_REQUEST).json({
        error: 'X-Project-Root required',
        message:
          'Project root is required. Configure headers["X-Project-Root"] in mcp.json (e.g. "${workspaceFolder}").',
      });
      return;
    }

    this.projectRootContext.run(trimmed, () => {
      next();
    });
  }
}
