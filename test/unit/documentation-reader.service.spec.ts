import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { DocumentationReaderService } from '@/mcp/domain/nestjs/data-access/services/documentation-reader.service';
import { ProjectContextService } from '@/mcp/domain/nestjs/data-access/services/project-context.service';
import { FileReaderService } from '@/mcp/core/data-access/services/file-reader.service';
import { createProjectContext } from '../helpers/mock-data';

const defaultDocsLayout = {
  features: 'docs/features/',
  architecture: 'docs/architecture/',
  changelog: 'docs/changes/4 - Changelog.md',
  conventions: 'docs/api/API-CONVENTIONS.md',
  testing: 'docs/tests/README-TESTS.md',
  entities: 'docs/diagrams/DATABASE-ENTITIES.md',
  apiOverview: 'docs/architecture/API-OVERVIEW.md',
};

describe('DocumentationReaderService', () => {
  let sut: DocumentationReaderService;
  let fileReader: jest.Mocked<FileReaderService>;
  let projectContext: jest.Mocked<ProjectContextService>;

  beforeEach(async () => {
    fileReader = {
      readFile: jest.fn(),
      readDir: jest.fn(),
    } as unknown as jest.Mocked<FileReaderService>;

    projectContext = {
      getContext: jest.fn().mockResolvedValue(
        createProjectContext({ docsLayout: defaultDocsLayout }),
      ),
    } as unknown as jest.Mocked<ProjectContextService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentationReaderService,
        { provide: FileReaderService, useValue: fileReader },
        { provide: ProjectContextService, useValue: projectContext },
      ],
    }).compile();

    sut = module.get(DocumentationReaderService);
  });

  describe('readDoc', () => {
    it('should read file by relative path', async () => {
      fileReader.readFile.mockResolvedValue('# Doc content');

      const result = await sut.readDoc('docs/README.md');

      expect(result).toBe('# Doc content');
      expect(fileReader.readFile).toHaveBeenCalledWith('docs/README.md');
    });

    it('should return null when file does not exist', async () => {
      fileReader.readFile.mockResolvedValue(null);

      const result = await sut.readDoc('missing.md');

      expect(result).toBeNull();
    });
  });

  describe('getArchitectureDocs', () => {
    it('should return only .md files from docs/architecture', async () => {
      projectContext.getContext.mockResolvedValue(
        createProjectContext({
          name: 'test',
          docsLayout: {
            ...defaultDocsLayout,
            architecture: 'docs/architecture/',
          },
        }),
      );
      fileReader.readDir.mockResolvedValue([
        'API-OVERVIEW.md',
        'AUTH.md',
        'other.txt',
      ]);
      fileReader.readFile
        .mockResolvedValueOnce('# API Overview')
        .mockResolvedValueOnce('# Auth');

      const result = await sut.getArchitectureDocs();

      expect(result).toEqual({
        'API-OVERVIEW.md': '# API Overview',
        'AUTH.md': '# Auth',
      });
      expect(result).not.toHaveProperty('other.txt');
    });

    it('should skip files with null content', async () => {
      fileReader.readDir.mockResolvedValue(['a.md', 'b.md']);
      fileReader.readFile
        .mockResolvedValueOnce('# Content')
        .mockResolvedValueOnce(null);

      const result = await sut.getArchitectureDocs();

      expect(result).toEqual({ 'a.md': '# Content' });
    });
  });

  describe('getFeatureDoc', () => {
    it('should read feature doc for module', async () => {
      fileReader.readFile.mockResolvedValue('# User docs');

      const result = await sut.getFeatureDoc('user');

      expect(result).toBe('# User docs');
      expect(fileReader.readFile).toHaveBeenCalledWith('docs/features/USER.md');
    });

    it('should try multiple paths for module doc', async () => {
      fileReader.readFile
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('# Custom module');

      const result = await sut.getFeatureDoc('my-custom-module');

      expect(result).toBe('# Custom module');
    });
  });

  describe('getApiConventions', () => {
    it('should read API-CONVENTIONS.md', async () => {
      fileReader.readFile.mockResolvedValue('# Conventions');

      const result = await sut.getApiConventions();

      expect(result).toBe('# Conventions');
      expect(fileReader.readFile).toHaveBeenCalledWith(
        'docs/api/API-CONVENTIONS.md',
      );
    });
  });

  describe('getTestingDocs', () => {
    it('should read README-TESTS.md', async () => {
      fileReader.readFile.mockResolvedValue('# Testing');

      const result = await sut.getTestingDocs();

      expect(result).toBe('# Testing');
      expect(fileReader.readFile).toHaveBeenCalledWith(
        'docs/tests/README-TESTS.md',
      );
    });
  });

  describe('getChangelog', () => {
    it('should read changelog file', async () => {
      fileReader.readFile.mockResolvedValue('# Changelog');

      const result = await sut.getChangelog();

      expect(result).toBe('# Changelog');
      expect(fileReader.readFile).toHaveBeenCalledWith(
        'docs/changes/4 - Changelog.md',
      );
    });
  });

  describe('getCursorRules', () => {
    it('should return only .mdc files from .cursor/rules', async () => {
      fileReader.readDir.mockResolvedValue([
        'rule1.mdc',
        'rule2.mdc',
        'other.txt',
      ]);
      fileReader.readFile
        .mockResolvedValueOnce('# Rule 1')
        .mockResolvedValueOnce('# Rule 2');

      const result = await sut.getCursorRules();

      expect(result).toEqual({
        'rule1.mdc': '# Rule 1',
        'rule2.mdc': '# Rule 2',
      });
    });
  });

  describe('getDatabaseEntities', () => {
    it('should read DATABASE-ENTITIES.md', async () => {
      fileReader.readFile.mockResolvedValue('# Entities');

      const result = await sut.getDatabaseEntities();

      expect(result).toBe('# Entities');
      expect(fileReader.readFile).toHaveBeenCalledWith(
        'docs/diagrams/DATABASE-ENTITIES.md',
      );
    });
  });

  describe('getApiOverview', () => {
    it('should read API-OVERVIEW.md', async () => {
      fileReader.readFile.mockResolvedValue('# API Overview');

      const result = await sut.getApiOverview();

      expect(result).toBe('# API Overview');
      expect(fileReader.readFile).toHaveBeenCalledWith(
        'docs/architecture/API-OVERVIEW.md',
      );
    });
  });

  describe('getReadme', () => {
    it('should read README.md', async () => {
      fileReader.readFile.mockResolvedValue('# Project');

      const result = await sut.getReadme();

      expect(result).toBe('# Project');
      expect(fileReader.readFile).toHaveBeenCalledWith('README.md');
    });
  });
});
