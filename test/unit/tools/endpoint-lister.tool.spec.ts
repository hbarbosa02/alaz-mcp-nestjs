import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { EndpointListerTool } from '@/mcp/feature/tools/endpoint-lister.tool';
import { CodebaseAnalyzerService } from '@/mcp/data-access/services/codebase-analyzer.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';

describe('EndpointListerTool', () => {
  let sut: EndpointListerTool;
  let codebaseAnalyzer: jest.Mocked<CodebaseAnalyzerService>;

  beforeEach(async () => {
    codebaseAnalyzer = {
      getEndpoints: jest.fn(),
    } as unknown as jest.Mocked<CodebaseAnalyzerService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EndpointListerTool,
        { provide: CodebaseAnalyzerService, useValue: codebaseAnalyzer },
        { provide: McpLoggerService, useValue: { logToolInvoked: jest.fn(), logToolResult: jest.fn() } },
      ],
    }).compile();

    sut = module.get(EndpointListerTool);
  });

  it('should return markdown table with endpoints', async () => {
    codebaseAnalyzer.getEndpoints.mockResolvedValue([
      {
        method: 'GET',
        path: '/user',
        controllerClass: 'UserController',
        controllerTag: 'user',
        moduleName: 'user',
        permissions: ['ListUsers'],
        authType: 'Bearer',
      },
    ]);

    const result = await sut.listEndpoints({});

    expect(result).toContain(
      '| Method | Path | Controller | Permissions | Auth |',
    );
    expect(result).toContain('GET');
    expect(result).toContain('/user');
    expect(result).toContain('UserController');
    expect(result).toContain('ListUsers');
    expect(result).toContain('Bearer');
  });

  it('should filter by moduleName when provided', async () => {
    codebaseAnalyzer.getEndpoints.mockResolvedValue([]);

    await sut.listEndpoints({ moduleName: 'user' });

    expect(codebaseAnalyzer.getEndpoints).toHaveBeenCalledWith('user');
  });

  it('should show "-" for empty permissions', async () => {
    codebaseAnalyzer.getEndpoints.mockResolvedValue([
      {
        method: 'POST',
        path: '/auth/login',
        controllerClass: 'AuthController',
        controllerTag: 'auth',
        moduleName: 'auth',
        permissions: [],
        authType: 'None',
      },
    ]);

    const result = await sut.listEndpoints({});

    expect(result).toContain('-');
  });
});
