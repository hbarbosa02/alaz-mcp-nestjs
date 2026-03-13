import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { FileReaderService } from '@/mcp/core/data-access/services/file-reader.service';

describe('FrameworkDetectorService', () => {
  let sut: FrameworkDetectorService;
  let fileReader: jest.Mocked<FileReaderService>;

  beforeEach(async () => {
    fileReader = {
      readFile: jest.fn(),
    } as unknown as jest.Mocked<FileReaderService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FrameworkDetectorService,
        { provide: FileReaderService, useValue: fileReader },
      ],
    }).compile();

    sut = module.get(FrameworkDetectorService);
  });

  it('should detect nestjs from package.json', async () => {
    fileReader.readFile.mockImplementation(async (path: string) => {
      if (path === 'package.json') {
        return JSON.stringify({
          dependencies: { '@nestjs/core': '^11' },
        });
      }
      return null;
    });

    const result = await sut.detect();

    expect(result).toBe('nestjs');
  });

  it('should detect angular from package.json', async () => {
    fileReader.readFile.mockImplementation(async (path: string) => {
      if (path === 'package.json') {
        return JSON.stringify({
          dependencies: { '@angular/core': '^17' },
        });
      }
      return null;
    });

    const result = await sut.detect();

    expect(result).toBe('angular');
  });

  it('should detect laravel from composer.json', async () => {
    fileReader.readFile.mockImplementation(async (path: string) => {
      if (path === 'package.json') return null;
      if (path === 'composer.json') {
        return JSON.stringify({
          require: { 'laravel/framework': '^11' },
        });
      }
      return null;
    });

    const result = await sut.detect();

    expect(result).toBe('laravel');
  });

  it('should return null when no framework detected', async () => {
    fileReader.readFile.mockResolvedValue(null);

    const result = await sut.detect();

    expect(result).toBeNull();
  });

  it('should return null for invalid package.json', async () => {
    fileReader.readFile.mockImplementation(async (path: string) => {
      if (path === 'package.json') return 'invalid json';
      return null;
    });

    const result = await sut.detect();

    expect(result).toBeNull();
  });
});
