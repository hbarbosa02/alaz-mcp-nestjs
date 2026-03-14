import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { EndpointListerTool } from '@/mcp/domain/nestjs/feature/tools/endpoint-lister.tool';
import type { CodebaseAnalyzerService } from '@/mcp/domain/nestjs/data-access/services/codebase-analyzer.service';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { ProjectRootContextService } from '@/mcp/core/data-access/services/project-root-context.service';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { createFrameworkAdapterMocks } from '@test/helpers/mock-data';

describe('EndpointListerTool', () => {
  let sut: EndpointListerTool;
  let codebaseAnalyzer: jest.Mocked<CodebaseAnalyzerService>;

  beforeEach(async () => {
    codebaseAnalyzer = {
      getEndpoints: jest.fn(),
    } as unknown as jest.Mocked<CodebaseAnalyzerService>;

    const { frameworkDetector, adapterRegistry } = createFrameworkAdapterMocks({
      codebaseAnalyzer,
    });

    const projectRootContext = {
      run: jest.fn((_root: string, fn: () => unknown) => fn()),
    } as unknown as jest.Mocked<ProjectRootContextService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EndpointListerTool,
        { provide: FrameworkDetectorService, useValue: frameworkDetector },
        { provide: FrameworkAdapterRegistryService, useValue: adapterRegistry },
        {
          provide: McpLoggerService,
          useValue: { logToolInvoked: jest.fn(), logToolResult: jest.fn() },
        },
        { provide: ProjectRootContextService, useValue: projectRootContext },
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

    expect(result).toContain('| Method | Path | Controller | Permissions | Auth |');
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

  it('should return unsupported message for non-nestjs framework', async () => {
    const { frameworkDetector, adapterRegistry } = createFrameworkAdapterMocks({
      codebaseAnalyzer,
    });
    adapterRegistry.getUnsupportedMessage.mockReturnValue('Angular: This feature is not supported.');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EndpointListerTool,
        { provide: FrameworkDetectorService, useValue: frameworkDetector },
        { provide: FrameworkAdapterRegistryService, useValue: adapterRegistry },
        {
          provide: McpLoggerService,
          useValue: { logToolInvoked: jest.fn(), logToolResult: jest.fn() },
        },
        {
          provide: ProjectRootContextService,
          useValue: { run: jest.fn((_r: string, fn: () => unknown) => fn()) },
        },
      ],
    }).compile();

    const tool = module.get(EndpointListerTool);
    const result = await tool.listEndpoints({});

    expect(result).toContain('Angular');
    expect(codebaseAnalyzer.getEndpoints).not.toHaveBeenCalled();
  });

  it('should use projectRootContext.run when projectRoot provided', async () => {
    const runMock = jest.fn((_root: string, fn: () => unknown) => fn());
    const projectRootContext = {
      run: runMock,
    } as unknown as jest.Mocked<ProjectRootContextService>;

    const { frameworkDetector, adapterRegistry } = createFrameworkAdapterMocks({
      codebaseAnalyzer,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EndpointListerTool,
        { provide: FrameworkDetectorService, useValue: frameworkDetector },
        { provide: FrameworkAdapterRegistryService, useValue: adapterRegistry },
        {
          provide: McpLoggerService,
          useValue: { logToolInvoked: jest.fn(), logToolResult: jest.fn() },
        },
        { provide: ProjectRootContextService, useValue: projectRootContext },
      ],
    }).compile();

    const tool = module.get(EndpointListerTool);
    codebaseAnalyzer.getEndpoints.mockResolvedValue([]);

    await tool.listEndpoints({ projectRoot: '/custom/path' });

    expect(runMock).toHaveBeenCalledWith('/custom/path', expect.any(Function));
  });
});
