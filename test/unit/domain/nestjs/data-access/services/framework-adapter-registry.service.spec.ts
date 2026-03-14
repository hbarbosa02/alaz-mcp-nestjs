import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  FrameworkAdapterRegistryService,
  UNSUPPORTED_FRAMEWORK_MESSAGE,
  FRAMEWORK_COMING_SOON_MESSAGE,
} from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { ModuleRegistryService } from '@/mcp/domain/nestjs/data-access/services/module-registry.service';
import { EntityIntrospectorService } from '@/mcp/domain/nestjs/data-access/services/entity-introspector.service';
import { CodebaseAnalyzerService } from '@/mcp/domain/nestjs/data-access/services/codebase-analyzer.service';
import { DocumentationReaderService } from '@/mcp/domain/nestjs/data-access/services/documentation-reader.service';
import { ProjectContextService } from '@/mcp/domain/nestjs/data-access/services/project-context.service';

describe('FrameworkAdapterRegistryService', () => {
  let sut: FrameworkAdapterRegistryService;
  const mockModuleRegistry = { listModules: jest.fn(), getModule: jest.fn() };
  const mockEntityIntrospector = { getEntitySchema: jest.fn() };
  const mockCodebaseAnalyzer = {
    getEndpoints: jest.fn(),
    getModuleEndpoints: jest.fn(),
  };
  const mockDocumentationReader = { getFeatureDoc: jest.fn() };
  const mockProjectContext = { getContext: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FrameworkAdapterRegistryService,
        { provide: ModuleRegistryService, useValue: mockModuleRegistry },
        {
          provide: EntityIntrospectorService,
          useValue: mockEntityIntrospector,
        },
        { provide: CodebaseAnalyzerService, useValue: mockCodebaseAnalyzer },
        {
          provide: DocumentationReaderService,
          useValue: mockDocumentationReader,
        },
        { provide: ProjectContextService, useValue: mockProjectContext },
      ],
    }).compile();

    sut = module.get(FrameworkAdapterRegistryService);
  });

  describe('getModuleRegistry', () => {
    it('should return moduleRegistry for nestjs', () => {
      expect(sut.getModuleRegistry('nestjs')).toBe(mockModuleRegistry);
    });
    it('should return null for angular', () => {
      expect(sut.getModuleRegistry('angular')).toBeNull();
    });
    it('should return null for laravel', () => {
      expect(sut.getModuleRegistry('laravel')).toBeNull();
    });
    it('should return null for null framework', () => {
      expect(sut.getModuleRegistry(null)).toBeNull();
    });
  });

  describe('getEntityIntrospector', () => {
    it('should return entityIntrospector for nestjs', () => {
      expect(sut.getEntityIntrospector('nestjs')).toBe(mockEntityIntrospector);
    });
    it('should return null for angular', () => {
      expect(sut.getEntityIntrospector('angular')).toBeNull();
    });
  });

  describe('getCodebaseAnalyzer', () => {
    it('should return codebaseAnalyzer for nestjs', () => {
      expect(sut.getCodebaseAnalyzer('nestjs')).toBe(mockCodebaseAnalyzer);
    });
    it('should return null for laravel', () => {
      expect(sut.getCodebaseAnalyzer('laravel')).toBeNull();
    });
  });

  describe('getDocumentationReader', () => {
    it('should return documentationReader for nestjs', () => {
      expect(sut.getDocumentationReader('nestjs')).toBe(mockDocumentationReader);
    });
    it('should return null for angular', () => {
      expect(sut.getDocumentationReader('angular')).toBeNull();
    });
  });

  describe('getProjectContext', () => {
    it('should return projectContext for nestjs', () => {
      expect(sut.getProjectContext('nestjs')).toBe(mockProjectContext);
    });
    it('should return null for laravel', () => {
      expect(sut.getProjectContext('laravel')).toBeNull();
    });
  });

  describe('getUnsupportedMessage', () => {
    it('should return UNSUPPORTED_FRAMEWORK_MESSAGE for null', () => {
      expect(sut.getUnsupportedMessage(null)).toBe(UNSUPPORTED_FRAMEWORK_MESSAGE);
    });
    it('should return Angular message for angular', () => {
      const msg = sut.getUnsupportedMessage('angular');
      expect(msg).toContain('Angular');
      expect(msg).toContain(FRAMEWORK_COMING_SOON_MESSAGE);
    });
    it('should return Laravel message for laravel', () => {
      const msg = sut.getUnsupportedMessage('laravel');
      expect(msg).toContain('Laravel');
      expect(msg).toContain(FRAMEWORK_COMING_SOON_MESSAGE);
    });
    it('should return null for nestjs', () => {
      expect(sut.getUnsupportedMessage('nestjs')).toBeNull();
    });
  });
});
