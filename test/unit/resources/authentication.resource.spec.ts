import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { AuthenticationResource } from '@/mcp/feature/resources/authentication.resource';
import { DocumentationReaderService } from '@/mcp/data-access/services/documentation-reader.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';

describe('AuthenticationResource', () => {
  let sut: AuthenticationResource;
  let docReader: jest.Mocked<DocumentationReaderService>;

  beforeEach(async () => {
    docReader = {
      readDoc: jest.fn(),
    } as unknown as jest.Mocked<DocumentationReaderService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationResource,
        { provide: DocumentationReaderService, useValue: docReader },
        { provide: McpLoggerService, useValue: { logResourceRead: jest.fn(), logResourceResult: jest.fn() } },
      ],
    }).compile();

    sut = module.get(AuthenticationResource);
  });

  it('should return authentication content', async () => {
    docReader.readDoc.mockResolvedValue('# Auth docs');

    const result = await sut.getAuthentication();

    expect(result).toBe('# Auth docs');
    expect(docReader.readDoc).toHaveBeenCalledWith(
      'docs/architecture/AUTHENTICATION.md',
    );
  });

  it('should return fallback when documentation not found', async () => {
    docReader.readDoc.mockResolvedValue(null);

    const result = await sut.getAuthentication();

    expect(result).toContain('# Authentication');
    expect(result).toContain('Documentation not found');
  });
});
