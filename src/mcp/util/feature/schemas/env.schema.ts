import { z } from 'zod';

/**
 * `PROJECT_ROOT` has no default: HTTP mode uses `X-Project-Root`; STDIO requires
 * `process.env.PROJECT_ROOT` in the MCP client config (AD-001).
 */
export const envSchema = z.object({
  PROJECT_ROOT: z.string().optional(),
  PORT: z.coerce.number().default(3100),
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
});

export type Env = z.infer<typeof envSchema>;
