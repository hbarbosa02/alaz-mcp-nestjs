import packageJson from '@app/package';

/**
 * Single source of truth for the MCP `initialize` / serverInfo version string.
 * Must stay aligned with the repository `version` in `package.json` (AD-002).
 */
export const MCP_SERVER_VERSION: string = packageJson.version;
