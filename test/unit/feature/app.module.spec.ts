import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

describe('AppModule', () => {
  const originalEnv = process.env;

  beforeAll(() => {
    process.env.NODE_ENV = 'development';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should compile successfully', async () => {
    const { AppModule } = await import('@/app.module');
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(module).toBeDefined();
  });
});
