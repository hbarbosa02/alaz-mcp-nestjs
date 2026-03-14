import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { AuthenticationResource } from '@/mcp/domain/nestjs/feature/resources/authentication.resource';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { createFrameworkAdapterMocks } from '@test/helpers/mock-data';

describe('AuthenticationResource', () => {
  let sut: AuthenticationResource;
  let docReader: { readDoc: jest.Mock };
  let mocks: ReturnType<typeof createFrameworkAdapterMocks>;

  beforeEach(async () => {
    docReader = { readDoc: jest.fn() };

    mocks = createFrameworkAdapterMocks({
      documentationReader: docReader,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationResource,
        {
          provide: FrameworkDetectorService,
          useValue: mocks.frameworkDetector,
        },
        {
          provide: FrameworkAdapterRegistryService,
          useValue: mocks.adapterRegistry,
        },
        {
          provide: McpLoggerService,
          useValue: {
            logResourceRead: jest.fn(),
            logResourceResult: jest.fn(),
          },
        },
      ],
    }).compile();

    sut = module.get(AuthenticationResource);
  });

  it('should return authentication content', async () => {
    docReader.readDoc.mockResolvedValue('# Auth docs');

    const result = await sut.getAuthentication();

    expect((result.contents[0] as { text: string }).text).toBe('# Auth docs');
    expect(docReader.readDoc).toHaveBeenCalledWith(
      'docs/architecture/AUTHENTICATION.md',
    );
  });

  it('should return fallback when documentation not found', async () => {
    docReader.readDoc.mockResolvedValue(null);

    const result = await sut.getAuthentication();

    const text = (result.contents[0] as { text: string }).text;
    expect(text).toContain('# Authentication');
    expect(text).toContain('Documentation not found');
  });
});
