import type { MiddlewareConsumer } from '@nestjs/common';
import { RequestMethod } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { McpNestjsModule } from '@/mcp/feature/mcp.module';

describe('McpNestjsModule', () => {
  it('should configure ProjectRootMiddleware for mcp, sse, and messages routes', async () => {
    const applyMock = jest.fn().mockReturnThis();
    const forRoutesMock = jest.fn().mockReturnThis();
    const consumer = {
      apply: applyMock,
      forRoutes: forRoutesMock,
    } as unknown as MiddlewareConsumer;

    const module = await Test.createTestingModule({
      imports: [McpNestjsModule],
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
