import type { MiddlewareConsumer } from '@nestjs/common';
import { RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { McpNestjsModule } from '@/mcp/feature/mcp.module';
import { envSchema } from '@/mcp/util/feature/schemas/env.schema';

describe('McpNestjsModule', () => {
  const previousNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = previousNodeEnv;
  });

  it('should configure ProjectRootMiddleware for mcp, sse, and messages routes', async () => {
    process.env.NODE_ENV = 'development';
    const applyMock = jest.fn().mockReturnThis();
    const forRoutesMock = jest.fn().mockReturnThis();
    const consumer = {
      apply: applyMock,
      forRoutes: forRoutesMock,
    } as unknown as MiddlewareConsumer;

    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validate: (config) => envSchema.parse(config),
        }),
        McpNestjsModule,
      ],
    }).compile();

    const mcpModule = module.get(McpNestjsModule);
    mcpModule.configure(consumer);

    expect(applyMock).toHaveBeenCalledTimes(1);
    expect(forRoutesMock).toHaveBeenCalledWith(
      { path: 'mcp', method: RequestMethod.ALL },
      { path: 'sse', method: RequestMethod.ALL },
      { path: 'messages', method: RequestMethod.ALL },
    );
  });
});
