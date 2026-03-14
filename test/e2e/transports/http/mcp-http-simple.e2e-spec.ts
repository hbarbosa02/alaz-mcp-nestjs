import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as path from 'path';
import { AppModule } from '@/app.module';
import type { AddressInfo } from 'net';
import type { Server } from 'http';

const PROJECT_ROOT = path.resolve(__dirname, '../../fixtures/sample-project');

describe('MCP HTTP - Simple bootstrap (E2E)', () => {
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

  it('should bootstrap the app', () => {
    expect(app).toBeDefined();
  });

  it('should accept POST initialize and return session', async () => {
    const initBody = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'e2e-test', version: '1.0.0' },
      },
    };
    const res = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'X-Project-Root': PROJECT_ROOT,
      },
      body: JSON.stringify(initBody),
    });
    expect(res.status).toBe(200);
    const sessionId = res.headers.get('mcp-session-id');
    expect(sessionId).toBeDefined();
    const text = await res.text();
    const jsonMatch = text.match(/\{"jsonrpc"[^}]+\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      expect((data as unknown as { result?: { serverInfo?: unknown } }).result?.serverInfo).toBeDefined();
    }
  });

  it('should reject GET /mcp without X-Project-Root', async () => {
    const res = await fetch(`${baseUrl}/mcp`, {
      method: 'GET',
      headers: { Accept: 'text/event-stream' },
    });
    expect(res.status).toBe(400);
  });
});
