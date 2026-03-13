import { HttpStatus } from '@nestjs/common';
import { ProjectRootMiddleware } from '@/mcp/feature/middleware/project-root.middleware';
import { ProjectRootContextService } from '@/mcp/data-access/services/project-root-context.service';
import type { Request, Response, NextFunction } from 'express';

describe('ProjectRootMiddleware', () => {
  let middleware: ProjectRootMiddleware;
  let projectRootContext: jest.Mocked<ProjectRootContextService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: NextFunction;

  beforeEach(() => {
    projectRootContext = {
      run: jest.fn((root: string, fn: () => void) => fn()),
    } as unknown as jest.Mocked<ProjectRootContextService>;

    middleware = new ProjectRootMiddleware(projectRootContext);

    mockReq = { headers: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFn = jest.fn();
  });

  it('should call next() when X-Project-Root header is present', () => {
    mockReq.headers!['x-project-root'] = '/path/to/project';

    middleware.use(
      mockReq as Request,
      mockRes as Response,
      nextFn,
    );

    expect(projectRootContext.run).toHaveBeenCalledWith(
      '/path/to/project',
      expect.any(Function),
    );
    expect(nextFn).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should trim header value before passing to context', () => {
    mockReq.headers!['x-project-root'] = '  /path/to/project  ';

    middleware.use(
      mockReq as Request,
      mockRes as Response,
      nextFn,
    );

    expect(projectRootContext.run).toHaveBeenCalledWith(
      '/path/to/project',
      expect.any(Function),
    );
    expect(nextFn).toHaveBeenCalled();
  });

  it('should return 400 when X-Project-Root header is absent', () => {
    middleware.use(
      mockReq as Request,
      mockRes as Response,
      nextFn,
    );

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'X-Project-Root required',
      message: expect.stringContaining('Project root is required'),
    });
    expect(projectRootContext.run).not.toHaveBeenCalled();
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should return 400 when X-Project-Root header is empty string', () => {
    mockReq.headers!['x-project-root'] = '';

    middleware.use(
      mockReq as Request,
      mockRes as Response,
      nextFn,
    );

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(projectRootContext.run).not.toHaveBeenCalled();
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should return 400 when X-Project-Root header is whitespace only', () => {
    mockReq.headers!['x-project-root'] = '   ';

    middleware.use(
      mockReq as Request,
      mockRes as Response,
      nextFn,
    );

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(projectRootContext.run).not.toHaveBeenCalled();
    expect(nextFn).not.toHaveBeenCalled();
  });
});
