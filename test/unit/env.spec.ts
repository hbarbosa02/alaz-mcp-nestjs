import { envSchema } from '@/mcp/util/feature/schemas/env.schema';

describe('envSchema', () => {
  it('should parse valid config with required fields', () => {
    const result = envSchema.parse({
      PROJECT_ROOT: '/home/project',
    });
    expect(result.PROJECT_ROOT).toBe('/home/project');
    expect(result.PORT).toBe(3100);
    expect(result.NODE_ENV).toBe('development');
  });

  it('should apply PORT default', () => {
    const result = envSchema.parse({
      PROJECT_ROOT: '/tmp',
    });
    expect(result.PORT).toBe(3100);
  });

  it('should apply NODE_ENV default', () => {
    const result = envSchema.parse({
      PROJECT_ROOT: '/tmp',
    });
    expect(result.NODE_ENV).toBe('development');
  });

  it('should coerce PORT to number', () => {
    const result = envSchema.parse({
      PROJECT_ROOT: '/tmp',
      PORT: '4000',
    });
    expect(result.PORT).toBe(4000);
  });

  it('should accept valid NODE_ENV values', () => {
    expect(
      envSchema.parse({ PROJECT_ROOT: '/tmp', NODE_ENV: 'staging' }).NODE_ENV,
    ).toBe('staging');
    expect(
      envSchema.parse({ PROJECT_ROOT: '/tmp', NODE_ENV: 'production' })
        .NODE_ENV,
    ).toBe('production');
  });

  it('should throw when PROJECT_ROOT is empty', () => {
    expect(() => envSchema.parse({ PROJECT_ROOT: '' })).toThrow();
  });

  it('should throw when PROJECT_ROOT is missing', () => {
    expect(() => envSchema.parse({})).toThrow();
  });
});
