import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConventionsResource } from '@/mcp/domain/nestjs/feature/resources/conventions.resource';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';
import { createFrameworkAdapterMocks } from '@test/helpers/mock-data';

describe('ConventionsResource', () => {
  let sut: ConventionsResource;
  let docReader: {
    getApiConventions: jest.Mock;
    getTestingDocs: jest.Mock;
    readDoc: jest.Mock;
    getCursorRules: jest.Mock;
  };
  let mocks: ReturnType<typeof createFrameworkAdapterMocks>;

  beforeEach(async () => {
    docReader = {
      getApiConventions: jest.fn(),
      getTestingDocs: jest.fn(),
      readDoc: jest.fn(),
      getCursorRules: jest.fn(),
    };

    mocks = createFrameworkAdapterMocks({
      documentationReader: docReader,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConventionsResource,
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

    sut = module.get(ConventionsResource);
  });

  describe('getApiConventions', () => {
    it('should return API conventions with cursor rule', async () => {
      docReader.getApiConventions.mockResolvedValue('# API');
      docReader.getCursorRules.mockResolvedValue({
        'api-conventions.mdc': '# Rule',
      });

      const result = await sut.getApiConventions();

      const text = (result.contents[0] as { text: string }).text;
      expect(text).toContain('# API Conventions');
      expect(text).toContain('# API');
      expect(text).toContain('## Cursor Rule');
      expect(text).toContain('# Rule');
    });

    it('should return minimal content when no docs', async () => {
      docReader.getApiConventions.mockResolvedValue(null);
      docReader.getCursorRules.mockResolvedValue({});

      const result = await sut.getApiConventions();

      expect((result.contents[0] as { text: string }).text).toContain('# API Conventions');
    });
  });

  describe('getTestingConventions', () => {
    it('should return testing conventions', async () => {
      docReader.getTestingDocs.mockResolvedValue('# Testing');
      docReader.getCursorRules.mockResolvedValue({
        'testing-patterns.mdc': '# Patterns',
      });

      const result = await sut.getTestingConventions();

      const text = (result.contents[0] as { text: string }).text;
      expect(text).toContain('# Testing Conventions');
      expect(text).toContain('# Testing');
    });
  });

  describe('getCqrsConventions', () => {
    it('should return CQRS conventions', async () => {
      docReader.readDoc.mockResolvedValue('# CQRS');
      docReader.getCursorRules.mockResolvedValue({
        'cqrs-and-jobs.mdc': '# Jobs',
      });

      const result = await sut.getCqrsConventions();

      const text = (result.contents[0] as { text: string }).text;
      expect(text).toContain('# CQRS and Jobs');
      expect(text).toContain('# CQRS');
      expect(docReader.readDoc).toHaveBeenCalledWith('docs/architecture/CQRS-AND-JOBS.md');
    });
  });
});
