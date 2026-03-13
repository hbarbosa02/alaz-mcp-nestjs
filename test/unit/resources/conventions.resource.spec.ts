import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConventionsResource } from '@/mcp/domain/nestjs/feature/resources/conventions.resource';
import { DocumentationReaderService } from '@/mcp/domain/nestjs/data-access/services/documentation-reader.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';

describe('ConventionsResource', () => {
  let sut: ConventionsResource;
  let docReader: jest.Mocked<DocumentationReaderService>;

  beforeEach(async () => {
    docReader = {
      getApiConventions: jest.fn(),
      getTestingDocs: jest.fn(),
      readDoc: jest.fn(),
      getCursorRules: jest.fn(),
    } as unknown as jest.Mocked<DocumentationReaderService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConventionsResource,
        { provide: DocumentationReaderService, useValue: docReader },
        { provide: McpLoggerService, useValue: { logResourceRead: jest.fn(), logResourceResult: jest.fn() } },
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

      expect(result).toContain('# API Conventions');
      expect(result).toContain('# API');
      expect(result).toContain('## Cursor Rule');
      expect(result).toContain('# Rule');
    });

    it('should return minimal content when no docs', async () => {
      docReader.getApiConventions.mockResolvedValue(null);
      docReader.getCursorRules.mockResolvedValue({});

      const result = await sut.getApiConventions();

      expect(result).toContain('# API Conventions');
    });
  });

  describe('getTestingConventions', () => {
    it('should return testing conventions', async () => {
      docReader.getTestingDocs.mockResolvedValue('# Testing');
      docReader.getCursorRules.mockResolvedValue({
        'testing-patterns.mdc': '# Patterns',
      });

      const result = await sut.getTestingConventions();

      expect(result).toContain('# Testing Conventions');
      expect(result).toContain('# Testing');
    });
  });

  describe('getCqrsConventions', () => {
    it('should return CQRS conventions', async () => {
      docReader.readDoc.mockResolvedValue('# CQRS');
      docReader.getCursorRules.mockResolvedValue({
        'cqrs-and-jobs.mdc': '# Jobs',
      });

      const result = await sut.getCqrsConventions();

      expect(result).toContain('# CQRS and Jobs');
      expect(result).toContain('# CQRS');
      expect(docReader.readDoc).toHaveBeenCalledWith(
        'docs/architecture/CQRS-AND-JOBS.md',
      );
    });
  });
});
