import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { promises as fs } from 'fs';
import { glob } from 'glob';
import { FileReaderService } from '@/mcp/core/data-access/services/file-reader.service';
import { PathResolverService } from '@/mcp/core/data-access/services/path-resolver.service';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    readdir: jest.fn(),
    access: jest.fn(),
  },
}));

jest.mock('glob', () => ({
  glob: jest.fn(),
}));

const mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;
const mockReaddir = fs.readdir as jest.MockedFunction<typeof fs.readdir>;
const mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;
const mockGlob = glob as unknown as jest.MockedFunction<typeof glob>;

describe('FileReaderService', () => {
  let sut: FileReaderService;
  const projectRoot = '/tmp/test-project';

  beforeEach(async () => {
    jest.clearAllMocks();

    const pathResolver = {
      resolve: jest.fn((...segments: string[]) =>
        `${projectRoot}/${segments.join('/')}`.replace(/\/+/g, '/'),
      ),
      root: projectRoot,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileReaderService,
        { provide: PathResolverService, useValue: pathResolver },
      ],
    }).compile();

    sut = module.get(FileReaderService);
  });

  it('should read file content', async () => {
    mockReadFile.mockResolvedValue('file content' as never);

    const result = await sut.readFile('docs/README.md');

    expect(result).toBe('file content');
    expect(mockReadFile).toHaveBeenCalledWith(
      expect.stringContaining('docs/README.md'),
      'utf-8',
    );
  });

  it('should return null when file does not exist', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'));

    const result = await sut.readFile('missing.txt');

    expect(result).toBeNull();
  });

  it('should list directory entries', async () => {
    mockReaddir.mockResolvedValue([
      { name: 'file1.ts', isFile: () => true, isDirectory: () => false },
      { name: 'file2.ts', isFile: () => true, isDirectory: () => false },
    ] as never);

    const result = await sut.readDir('src/user');

    expect(result).toEqual(['file1.ts', 'file2.ts']);
    expect(mockReaddir).toHaveBeenCalledWith(
      expect.stringContaining('src/user'),
      { withFileTypes: true },
    );
  });

  it('should return empty array when directory does not exist', async () => {
    mockReaddir.mockRejectedValue(new Error('ENOENT'));

    const result = await sut.readDir('missing-dir');

    expect(result).toEqual([]);
  });

  it('should return true when path exists', async () => {
    mockAccess.mockResolvedValue(undefined as never);

    const result = await sut.exists('src/main.ts');

    expect(result).toBe(true);
    expect(mockAccess).toHaveBeenCalledWith(
      expect.stringContaining('src/main.ts'),
    );
  });

  it('should return false when path does not exist', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT'));

    const result = await sut.exists('missing');

    expect(result).toBe(false);
  });

  it('should return files matching glob pattern', async () => {
    mockGlob.mockResolvedValue([
      `${projectRoot}/src/user/user.entity.ts`,
      `${projectRoot}/src/tenant/tenant.entity.ts`,
    ]);

    const result = await sut.readGlob('src/**/*.entity.ts');

    expect(result.length).toBe(2);
    expect(result[0]).toContain('user.entity.ts');
    expect(mockGlob).toHaveBeenCalledWith(
      expect.stringContaining('src/**/*.entity.ts'),
      { nodir: true },
    );
  });

  it('should return empty array when glob fails', async () => {
    mockGlob.mockRejectedValue(new Error('glob error'));

    const result = await sut.readGlob('invalid/**/*.ts');

    expect(result).toEqual([]);
  });
});
