import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as path from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { AppModule } from '@/app.module';
import {
  EXPECTED_TOOLS,
  EXPECTED_STATIC_RESOURCES,
  EXPECTED_RESOURCE_TEMPLATES,
  EXPECTED_PROMPTS,
} from '@test/e2e/setup/mcp-client.setup';
import type { AddressInfo } from 'net';
import type { Server } from 'http';

const PROJECT_ROOT = path.resolve(__dirname, '../../fixtures/sample-project');

interface AnyResponse {
  result?: unknown;
  error?: {
    message?: string;
  };
}

async function initMcpSession(baseUrl: string): Promise<string> {
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
  if (!sessionId) throw new Error('No session ID in response');
  return sessionId;
}

async function mcpRequest(
  baseUrl: string,
  sessionId: string,
  method: string,
  params?: object,
  id = 2,
): Promise<unknown> {
  const body = {
    jsonrpc: '2.0',
    id,
    method,
    params: params ?? {},
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const res = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'X-Project-Root': PROJECT_ROOT,
      'Mcp-Session-Id': sessionId,
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  });

  clearTimeout(timeout);
  expect(res.status).toBe(200);

  const text = await res.text();
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = JSON.parse(text) as unknown as AnyResponse;

    if (data.error) {
      throw new Error(JSON.stringify(data.error));
    }

    return data.result;
  }

  const dataMatch = text.match(/data:\s*(\{[\s\S]*?\})\s*(\n|$)/m);

  if (dataMatch) {
    const data = JSON.parse(dataMatch[1]) as unknown as AnyResponse;

    if (data.error) {
      throw new Error(JSON.stringify(data.error));
    }

    return data.result;
  }

  const anyJson = text.match(
    /\{"jsonrpc"\s*:\s*"2\.0"[^}]*"result"\s*:\s*(\{[^]*?\})\s*\}\s*$/m,
  );

  if (anyJson) {
    const parsed = JSON.parse(anyJson[0]) as unknown as AnyResponse;
    if (parsed.error) {
      throw new Error(JSON.stringify(parsed.error));
    }
    return parsed.result;
  }

  throw new Error(`No JSON in response: ${text.slice(0, 300)}`);
}

describe('MCP Streamable HTTP (E2E)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let sessionId: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    const server = (await app.listen(0)) as unknown as Server;
    const port = (server.address() as unknown as AddressInfo).port;
    baseUrl = `http://localhost:${port}`;
    sessionId = await initMcpSession(baseUrl);
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('connection', () => {
    it('should list tools', async () => {
      const result = (await mcpRequest(baseUrl, sessionId, 'tools/list')) as {
        tools: { name: string }[];
      };
      expect(result.tools).toBeDefined();
      expect(result.tools.length).toBeGreaterThan(0);
      const names = result.tools.map((t) => t.name);
      for (const name of EXPECTED_TOOLS) {
        expect(names).toContain(name);
      }
    });

    it('should list resources', async () => {
      const result = (await mcpRequest(
        baseUrl,
        sessionId,
        'resources/list',
      )) as {
        resources: { uri: string }[];
      };
      const uris = result.resources.map((r) => r.uri);
      for (const uri of EXPECTED_STATIC_RESOURCES) {
        expect(uris).toContain(uri);
      }
    });

    it('should list resource templates', async () => {
      const result = (await mcpRequest(
        baseUrl,
        sessionId,
        'resources/templates/list',
      )) as {
        resourceTemplates: { uriTemplate: string }[];
      };
      const templates = result.resourceTemplates.map((t) => t.uriTemplate);
      for (const template of EXPECTED_RESOURCE_TEMPLATES) {
        expect(templates).toContain(template);
      }
    });

    it('should list prompts', async () => {
      const result = (await mcpRequest(baseUrl, sessionId, 'prompts/list')) as {
        prompts: { name: string }[];
      };
      const names = result.prompts.map((p) => p.name);
      for (const name of EXPECTED_PROMPTS) {
        expect(names).toContain(name);
      }
    });
  });

  describe('tools', () => {
    it('should call list-modules', async () => {
      const result = (await mcpRequest(baseUrl, sessionId, 'tools/call', {
        name: 'list-modules',
        arguments: { projectRoot: PROJECT_ROOT },
      })) as { content: { type: string; text?: string }[] };
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content.some((c) => c.type === 'text')).toBe(true);
    });

    it('should call get-module-detail', async () => {
      const result = (await mcpRequest(baseUrl, sessionId, 'tools/call', {
        name: 'get-module-detail',
        arguments: { moduleName: 'user', projectRoot: PROJECT_ROOT },
      })) as { content: { type: string; text?: string }[] };
      expect(result.content).toBeDefined();
      const textContent = result.content.find((c) => c.type === 'text');
      expect(textContent?.text).toContain('user');
    });

    it('should call get-entity-schema', async () => {
      const result = (await mcpRequest(baseUrl, sessionId, 'tools/call', {
        name: 'get-entity-schema',
        arguments: { entityName: 'User', projectRoot: PROJECT_ROOT },
      })) as { content: { type: string; text?: string }[] };
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('should call list-endpoints', async () => {
      const result = (await mcpRequest(baseUrl, sessionId, 'tools/call', {
        name: 'list-endpoints',
        arguments: { projectRoot: PROJECT_ROOT },
      })) as { content: { type: string }[] };
      expect(result.content).toBeDefined();
    });

    it('should call check-conventions', async () => {
      const result = (await mcpRequest(baseUrl, sessionId, 'tools/call', {
        name: 'check-conventions',
        arguments: { moduleName: 'user', projectRoot: PROJECT_ROOT },
      })) as { content: { type: string }[] };
      expect(result.content).toBeDefined();
    });

    it('should call get-recent-changes', async () => {
      const result = (await mcpRequest(baseUrl, sessionId, 'tools/call', {
        name: 'get-recent-changes',
        arguments: { days: 7, projectRoot: PROJECT_ROOT },
      })) as { content: { type: string }[] };
      expect(result.content).toBeDefined();
    });

    it('should call get-test-summary', async () => {
      const result = (await mcpRequest(baseUrl, sessionId, 'tools/call', {
        name: 'get-test-summary',
        arguments: { projectRoot: PROJECT_ROOT },
      })) as { content: { type: string }[] };
      expect(result.content).toBeDefined();
    });
  });

  describe('resources', () => {
    it('should read alaz://onboarding', async () => {
      const result = (await mcpRequest(baseUrl, sessionId, 'resources/read', {
        uri: 'alaz://onboarding',
      })) as { contents: { uri: string }[] };
      expect(result.contents).toBeDefined();
      expect(result.contents.length).toBeGreaterThan(0);
    });

    it('should read alaz://changelog', async () => {
      const result = (await mcpRequest(baseUrl, sessionId, 'resources/read', {
        uri: 'alaz://changelog',
      })) as { contents: { uri: string }[] };
      expect(result.contents).toBeDefined();
    });

    it('should read alaz://architecture', async () => {
      const result = (await mcpRequest(baseUrl, sessionId, 'resources/read', {
        uri: 'alaz://architecture',
      })) as { contents: { uri: string; text?: string }[] };
      expect(result.contents).toBeDefined();
      expect(result.contents.length).toBeGreaterThan(0);
    });

    it('should read alaz://conventions/api', async () => {
      const result = (await mcpRequest(baseUrl, sessionId, 'resources/read', {
        uri: 'alaz://conventions/api',
      })) as { contents: { uri: string }[] };
      expect(result.contents).toBeDefined();
    });

    it('should read template resource alaz://modules/user', async () => {
      const result = (await mcpRequest(baseUrl, sessionId, 'resources/read', {
        uri: 'alaz://modules/user',
      })) as { contents: { uri: string }[] };
      expect(result.contents).toBeDefined();
    });

    it('should read template resource alaz://modules/user/endpoints', async () => {
      const result = (await mcpRequest(baseUrl, sessionId, 'resources/read', {
        uri: 'alaz://modules/user/endpoints',
      })) as { contents: { uri: string }[] };
      expect(result.contents).toBeDefined();
    });

    it('should read template resource alaz://entities/User', async () => {
      const result = (await mcpRequest(baseUrl, sessionId, 'resources/read', {
        uri: 'alaz://entities/User',
      })) as { contents: { uri: string }[] };
      expect(result.contents).toBeDefined();
    });
  });

  describe('prompts', () => {
    it('should get create-module prompt via SDK Client', async () => {
      const client = new Client({ name: 'e2e-test', version: '1.0.0' });
      const transport = new StreamableHTTPClientTransport(
        new URL(`${baseUrl}/mcp`),
        {
          requestInit: {
            headers: {
              'X-Project-Root': PROJECT_ROOT,
              'Content-Type': 'application/json',
              Accept: 'application/json, text/event-stream',
            },
          },
        },
      );
      try {
        await client.connect(transport);
        const result = await client.getPrompt({
          name: 'create-module',
          arguments: {
            moduleName: 'billing',
            hasController: 'true',
            hasEntity: 'true',
          },
        });
        expect(result.messages).toBeDefined();
        expect(result.messages.length).toBeGreaterThan(0);
        const textContent = result.messages
          .map((m) => (m.content?.type === 'text' ? m.content.text : ''))
          .join(' ');
        expect(textContent).toContain('billing');
      } finally {
        await transport.close();
      }
    }, 10000);
  });
});
