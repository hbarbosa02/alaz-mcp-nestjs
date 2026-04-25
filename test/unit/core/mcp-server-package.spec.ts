import packageJson from '@app/package';
import { MCP_SERVER_VERSION } from '@/mcp/core/mcp-server-package';

describe('MCP server package version', () => {
  it('should expose the same version string as package.json (AD-002)', () => {
    expect(MCP_SERVER_VERSION).toBe(packageJson.version);
    expect(MCP_SERVER_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
