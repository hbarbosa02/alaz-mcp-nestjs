import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { CodebaseAnalyzerService } from '@/mcp/domain/nestjs/data-access/services/codebase-analyzer.service';
import { FileReaderService } from '@/mcp/core/data-access/services/file-reader.service';

const sampleControllerContent = `
@ApiTags('user')
@Controller('user')
export class UserController {
  @Permissions(PermissionCode.ListUsers)
  @Get()
  list() {}

  @Permissions(PermissionCode.ViewUser)
  @Get(':uuid')
  getOne() {}

  @Permissions(PermissionCode.CreateUser)
  @Post()
  create() {}
}
`;

const sampleControllerWithAuthNone = `
@ApiTags('auth')
@Auth(AuthType.None)
@Controller('auth/login')
export class AuthController {
  @Post()
  login() {}
}
`;

describe('CodebaseAnalyzerService', () => {
  let sut: CodebaseAnalyzerService;
  let fileReader: jest.Mocked<FileReaderService>;

  beforeEach(async () => {
    fileReader = {
      readGlob: jest.fn(),
      readFile: jest.fn(),
    } as unknown as jest.Mocked<FileReaderService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodebaseAnalyzerService,
        { provide: FileReaderService, useValue: fileReader },
      ],
    }).compile();

    sut = module.get(CodebaseAnalyzerService);
  });

  it('should return empty list when no controllers found', async () => {
    fileReader.readGlob.mockResolvedValue([]);
    const result = await sut.getEndpoints();
    expect(result).toEqual([]);
  });

  it('should extract endpoints from controller content', async () => {
    fileReader.readGlob.mockResolvedValue([
      'src/user/feature/user.controller.ts',
    ]);
    fileReader.readFile.mockResolvedValue(sampleControllerContent);

    const result = await sut.getEndpoints();

    expect(result.length).toBe(3);
    expect(result[0]).toMatchObject({
      method: 'GET',
      controllerClass: 'UserController',
      controllerTag: 'user',
      moduleName: 'user',
    });
    expect(result[0].path).toContain('user');
    expect(result[0].permissions).toContain('ListUsers');
  });

  it('should filter by moduleName when provided', async () => {
    fileReader.readGlob.mockResolvedValue([
      'src/user/feature/user.controller.ts',
    ]);
    fileReader.readFile.mockResolvedValue(sampleControllerContent);

    const result = await sut.getEndpoints('user');

    expect(fileReader.readGlob).toHaveBeenCalledWith(
      'src/user/**/*.controller.ts',
    );
    expect(result.length).toBe(3);
  });

  it('should detect AuthType.None when present', async () => {
    fileReader.readGlob.mockResolvedValue([
      'src/authentication/feature/auth.controller.ts',
    ]);
    fileReader.readFile.mockResolvedValue(sampleControllerWithAuthNone);

    const result = await sut.getEndpoints();

    expect(result[0].authType).toBe('None');
    expect(result[0].controllerTag).toBe('auth');
  });

  it('should return same result for getModuleEndpoints as getEndpoints with module', async () => {
    fileReader.readGlob.mockResolvedValue([
      'src/tenant/feature/tenant.controller.ts',
    ]);
    fileReader.readFile.mockResolvedValue(sampleControllerContent);

    const [endpoints, moduleEndpoints] = await Promise.all([
      sut.getEndpoints('tenant'),
      sut.getModuleEndpoints('tenant'),
    ]);

    expect(moduleEndpoints).toEqual(endpoints);
  });

  it('should detect AuthType.Jwt when present', async () => {
    const content = `
@ApiTags('user')
@Auth(AuthType.Jwt)
@Controller('user')
export class UserController {
  @Get()
  list() {}
}
`;
    fileReader.readGlob.mockResolvedValue([
      'src/user/feature/user.controller.ts',
    ]);
    fileReader.readFile.mockResolvedValue(content);

    const result = await sut.getEndpoints();

    expect(result[0].authType).toBe('Jwt');
  });

  it('should detect AuthType.Auth0 when present', async () => {
    const content = `
@ApiTags('user')
@Auth(AuthType.Auth0)
@Controller('user')
export class UserController {
  @Get()
  list() {}
}
`;
    fileReader.readGlob.mockResolvedValue([
      'src/user/feature/user.controller.ts',
    ]);
    fileReader.readFile.mockResolvedValue(content);

    const result = await sut.getEndpoints();

    expect(result[0].authType).toBe('Auth0');
  });

  it('should use Default auth when no Auth decorator', async () => {
    const content = `
@ApiTags('user')
@Controller('user')
export class UserController {
  @Get()
  list() {}
}
`;
    fileReader.readGlob.mockResolvedValue([
      'src/user/feature/user.controller.ts',
    ]);
    fileReader.readFile.mockResolvedValue(content);

    const result = await sut.getEndpoints();

    expect(result[0].authType).toBe('Default');
  });

  it('should extract method with path parameter', async () => {
    const content = `
@ApiTags('user')
@Controller('user')
export class UserController {
  @Get('profile')
  getProfile() {}
}
`;
    fileReader.readGlob.mockResolvedValue([
      'src/user/feature/user.controller.ts',
    ]);
    fileReader.readFile.mockResolvedValue(content);

    const result = await sut.getEndpoints();

    expect(result[0].path).toContain('profile');
  });

  it('should skip files with empty content', async () => {
    fileReader.readGlob.mockResolvedValue([
      'src/user/feature/user.controller.ts',
      'src/tenant/feature/tenant.controller.ts',
    ]);
    fileReader.readFile
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(sampleControllerContent);

    const result = await sut.getEndpoints();

    expect(result.length).toBe(3);
  });
});
