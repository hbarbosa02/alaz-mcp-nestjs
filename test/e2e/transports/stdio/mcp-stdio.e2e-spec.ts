import { spawn } from 'child_process';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../fixtures/sample-project');
const PROJECT_CWD = process.cwd();
const STDIO_ENTRY = path.join(PROJECT_CWD, 'src/mcp/feature/mcp-stdio.entry.ts');

interface AnyResponse {
  result?: unknown;
  error?: {
    message?: string;
  };
}

function runMcpStdio(request: object): Promise<AnyResponse> {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['ts-node', '-r', 'tsconfig-paths/register', STDIO_ENTRY], {
      cwd: PROJECT_CWD,
      env: { ...process.env, PROJECT_ROOT },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    proc.stdout.on('data', (chunk) => {
      stdout += (chunk as unknown as string).toString();
    });

    proc.stderr.on('data', () => {
      // ignore error
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}`));
        return;
      }
      const lines = stdout.split('\n').filter((l) => l.trim().startsWith('{'));
      const last = lines[lines.length - 1];
      if (last) {
        try {
          const data = JSON.parse(last) as unknown as AnyResponse;
          resolve(data);
        } catch {
          resolve({ error: { message: 'Failed to parse response' } });
        }
      } else {
        resolve({
          error: { message: `No JSON in output: ${stdout.slice(0, 200)}` },
        });
      }
    });

    proc.on('error', reject);

    proc.stdin.write(JSON.stringify(request) + '\n');
    proc.stdin.end();
  });
}

async function runMcpStdioWithRequests(
  requests: object[],
): Promise<{ result?: unknown; error?: { message: string } }[]> {
  return new Promise((resolve, reject) => {
    const results: { result?: unknown; error?: { message: string } }[] = [];
    let buffer = '';

    const proc = spawn('npx', ['ts-node', '-r', 'tsconfig-paths/register', STDIO_ENTRY], {
      cwd: PROJECT_CWD,
      env: { ...process.env, PROJECT_ROOT },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    proc.stdout.on('data', (chunk) => {
      buffer += (chunk as unknown as string).toString();
      const fullLines = buffer.split('\n');
      buffer = fullLines.pop() ?? '';
      for (const line of fullLines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('{')) {
          try {
            const data = JSON.parse(trimmed) as unknown as AnyResponse;
            results.push({
              result: data.result,
              error: data.error ? { message: data.error.message ?? '' } : undefined,
            });
          } catch {
            results.push({
              error: { message: 'Failed to parse response' },
            });
          }
        }
      }
      if (results.length >= requests.length) {
        proc.kill();
      }
    });

    proc.on('close', () => {
      resolve(results);
    });

    proc.on('error', reject);

    for (const req of requests) {
      proc.stdin.write(JSON.stringify(req) + '\n');
    }
    proc.stdin.end();
  });
}

describe('MCP STDIO (E2E)', () => {
  it('should spawn stdio process and respond to initialize', async () => {
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'e2e-stdio', version: '1.0.0' },
      },
    };
    const response = await runMcpStdio(initRequest);
    expect(response.result).toBeDefined();
    expect((response.result as { serverInfo?: unknown }).serverInfo).toBeDefined();
  }, 15000);

  it('should list tools via stdio', async () => {
    const result = await runMcpStdioWithRequests([
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'e2e', version: '1.0.0' },
        },
      },
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      },
    ]);
    expect(result[1].error).toBeUndefined();
    expect(result[1].result).toBeDefined();
    const tools = (result[1].result as { tools?: { name: string }[] }).tools;
    expect(tools).toBeDefined();

    if (!tools) {
      throw new Error('tools/list response missing tools array. Check MCP STDIO transport.');
    }
    expect(tools.length).toBeGreaterThan(0);
    expect(tools.map((t) => t.name)).toContain('list-modules');
  }, 15000);

  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'e2e', version: '1.0.0' },
    },
  };

  it('should call list-modules via stdio', async () => {
    const result = await runMcpStdioWithRequests([
      initRequest,
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'list-modules',
          arguments: { projectRoot: PROJECT_ROOT },
        },
      },
    ]);
    expect(result[1].error).toBeUndefined();
    const content = (result[1].result as { content?: { type: string; text?: string }[] })?.content;
    expect(content).toBeDefined();

    if (!content) {
      throw new Error('list-modules tool call response missing content. Check MCP STDIO transport.');
    }
    expect(content.some((c) => c.type === 'text')).toBe(true);
  }, 15000);

  it('should call get-module-detail via stdio', async () => {
    const result = await runMcpStdioWithRequests([
      initRequest,
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'get-module-detail',
          arguments: { moduleName: 'user', projectRoot: PROJECT_ROOT },
        },
      },
    ]);
    expect(result[1].error).toBeUndefined();
    const content = (result[1].result as { content?: { type: string; text?: string }[] })?.content;
    expect(content).toBeDefined();

    if (!content) {
      throw new Error('get-module-detail tool call response missing content. Check MCP STDIO transport.');
    }
    expect(content.length).toBeGreaterThan(0);
    const textContent = content.find((c) => c.type === 'text');
    expect(textContent?.text).toBeDefined();
    // May contain module details or unsupported message depending on project root resolution
    expect(typeof textContent?.text).toBe('string');
  }, 15000);

  it('should call get-entity-schema via stdio', async () => {
    const result = await runMcpStdioWithRequests([
      initRequest,
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'get-entity-schema',
          arguments: { entityName: 'User', projectRoot: PROJECT_ROOT },
        },
      },
    ]);
    expect(result[1].error).toBeUndefined();
    expect((result[1].result as { content?: unknown[] })?.content).toBeDefined();
  }, 15000);

  it('should call list-endpoints via stdio', async () => {
    const result = await runMcpStdioWithRequests([
      initRequest,
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'list-endpoints',
          arguments: { projectRoot: PROJECT_ROOT },
        },
      },
    ]);
    expect(result[1].error).toBeUndefined();
    expect((result[1].result as { content?: unknown[] })?.content).toBeDefined();
  }, 15000);

  it('should call check-conventions via stdio', async () => {
    const result = await runMcpStdioWithRequests([
      initRequest,
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'check-conventions',
          arguments: { moduleName: 'user', projectRoot: PROJECT_ROOT },
        },
      },
    ]);
    expect(result[1].error).toBeUndefined();
    expect((result[1].result as { content?: unknown[] })?.content).toBeDefined();
  }, 15000);

  it('should call get-recent-changes via stdio', async () => {
    const result = await runMcpStdioWithRequests([
      initRequest,
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'get-recent-changes',
          arguments: { days: 7, projectRoot: PROJECT_ROOT },
        },
      },
    ]);
    expect(result[1].error).toBeUndefined();
    expect((result[1].result as { content?: unknown[] })?.content).toBeDefined();
  }, 15000);

  it('should call get-test-summary via stdio', async () => {
    const result = await runMcpStdioWithRequests([
      initRequest,
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'get-test-summary',
          arguments: { projectRoot: PROJECT_ROOT },
        },
      },
    ]);
    expect(result[1].error).toBeUndefined();
    expect((result[1].result as { content?: unknown[] })?.content).toBeDefined();
  }, 15000);

  it('should call get-create-module-guide via stdio', async () => {
    const result = await runMcpStdioWithRequests([
      initRequest,
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'get-create-module-guide',
          arguments: {
            moduleName: 'billing',
            hasController: true,
            hasEntity: true,
            projectRoot: PROJECT_ROOT,
          },
        },
      },
    ]);
    expect(result[1].error).toBeUndefined();
    const content = (result[1].result as { content?: { type: string; text?: string }[] })?.content;
    expect(content).toBeDefined();

    if (!content) {
      throw new Error('get-create-module-guide tool call response missing content. Check MCP STDIO transport.');
    }
    expect(content.length).toBeGreaterThan(0);
    const textContent = content.find((c) => c.type === 'text');
    expect(textContent?.text).toBeDefined();
    expect(textContent?.text).toContain('billing');
  }, 15000);

  describe('resources', () => {
    it('should list resources via stdio', async () => {
      const result = await runMcpStdioWithRequests([
        initRequest,
        {
          jsonrpc: '2.0',
          id: 2,
          method: 'resources/list',
          params: {},
        },
      ]);
      expect(result[1].error).toBeUndefined();
      const resources = (result[1].result as { resources?: { uri: string }[] })?.resources;
      expect(resources).toBeDefined();

      if (!resources) {
        throw new Error('resources/list response missing resources array. Check MCP STDIO transport.');
      }
      expect(resources.length).toBeGreaterThan(0);
      expect(resources.map((r) => r.uri)).toContain('alaz://onboarding');
    }, 15000);

    it('should read alaz://onboarding via stdio', async () => {
      const result = await runMcpStdioWithRequests([
        initRequest,
        {
          jsonrpc: '2.0',
          id: 2,
          method: 'resources/read',
          params: { uri: 'alaz://onboarding' },
        },
      ]);
      expect(result[1].error).toBeUndefined();
      const contents = (result[1].result as { contents?: unknown[] })?.contents;
      expect(contents).toBeDefined();

      if (!contents) {
        throw new Error('resources/read alaz://onboarding response missing contents. Check MCP STDIO transport.');
      }
      expect(contents.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('prompts', () => {
    it('should get create-module prompt via stdio', async () => {
      const result = await runMcpStdioWithRequests([
        initRequest,
        {
          jsonrpc: '2.0',
          id: 2,
          method: 'prompts/get',
          params: {
            name: 'create-module',
            arguments: {
              moduleName: 'billing',
              hasController: 'true',
              hasEntity: 'true',
            },
          },
        },
      ]);
      expect(result[1].error).toBeUndefined();
      const promptResult = result[1].result as {
        messages?: { content?: { type?: string; text?: string } }[];
      };
      expect(promptResult).toBeDefined();
      expect(promptResult.messages).toBeDefined();

      if (!promptResult.messages) {
        throw new Error('prompts/get create-module response missing messages. Check MCP STDIO transport.');
      }
      expect(promptResult.messages.length).toBeGreaterThan(0);
      const textContent = promptResult.messages
        .map((m) => (m.content?.type === 'text' ? m.content.text : ''))
        .join(' ');
      expect(textContent).toContain('billing');
    }, 15000);
  });
});
