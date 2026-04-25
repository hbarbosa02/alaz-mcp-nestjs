import { envSchema } from '@/mcp/util/feature/schemas/env.schema';

describe('envSchema', () => {
  it('should parse valid config with defaults', () => {
    const result = envSchema.parse({});
    expect(result.PORT).toBe(3100);
    expect(result.NODE_ENV).toBe('development');
    expect(result.PROJECT_ROOT).toBeUndefined();
  });

  it('should not set a default PROJECT_ROOT (HTTP uses X-Project-Root; STDIO uses process.env)', () => {
    const result = envSchema.parse({});

    expect(result.PROJECT_ROOT).toBeUndefined();
  });

  it('should accept an explicit PROJECT_ROOT', () => {
    const result = envSchema.parse({ PROJECT_ROOT: '/var/workspace/app' });

    expect(result.PROJECT_ROOT).toBe('/var/workspace/app');
  });

  it('should apply PORT default', () => {
    const result = envSchema.parse({});
    expect(result.PORT).toBe(3100);
  });

  it('should apply NODE_ENV default', () => {
    const result = envSchema.parse({});
    expect(result.NODE_ENV).toBe('development');
  });

  it('should coerce PORT to number', () => {
    const result = envSchema.parse({ PORT: '4000' });
    expect(result.PORT).toBe(4000);
  });

  it('should accept valid NODE_ENV values', () => {
    expect(envSchema.parse({ NODE_ENV: 'staging' }).NODE_ENV).toBe('staging');
    expect(envSchema.parse({ NODE_ENV: 'production' }).NODE_ENV).toBe('production');
  });
});
