import { envSchema } from '@/mcp/util/feature/schemas/env.schema';

describe('envSchema', () => {
  it('should parse valid config with defaults', () => {
    const result = envSchema.parse({});
    expect(result.PORT).toBe(3100);
    expect(result.NODE_ENV).toBe('development');
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
    expect(envSchema.parse({ NODE_ENV: 'production' }).NODE_ENV).toBe(
      'production',
    );
  });
});
