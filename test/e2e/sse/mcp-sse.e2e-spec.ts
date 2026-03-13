import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as path from 'path';
import { AppModule } from '@/app.module';
import type { AddressInfo } from 'net';
import type { Server } from 'http';

const PROJECT_ROOT = path.resolve(__dirname, '../fixtures/sample-project');

describe('MCP SSE (E2E)', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    const server = (await app.listen(0)) as unknown as Server;
    const port = (server.address() as unknown as AddressInfo).port;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('should expose SSE endpoint at /sse', async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${baseUrl}/sse`, {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
        'X-Project-Root': PROJECT_ROOT,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    await res.body?.cancel().catch(() => {
      // ignore error
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
  });

  it('should reject SSE without X-Project-Root', async () => {
    const res = await fetch(`${baseUrl}/sse`, {
      method: 'GET',
      headers: { Accept: 'text/event-stream' },
    });
    expect(res.status).toBe(400);
  });
});
