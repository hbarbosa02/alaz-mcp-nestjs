import type { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Wraps plain text content into MCP ReadResourceResult format.
 * Resources must return this format for clients (e.g. Cursor) to parse correctly.
 */
export function toReadResourceResult(
  uri: string,
  mimeType: string,
  text: string,
): ReadResourceResult {
  return {
    contents: [{ uri, mimeType, text }],
  };
}
