import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().default(3100),
  NODE_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development'),
});

export type Env = z.infer<typeof envSchema>;
