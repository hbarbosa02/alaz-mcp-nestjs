import { z } from 'zod';

export const envSchema = z.object({
  PROJECT_ROOT: z.string().default('/home/hbarbosa/cloudplusplus/atlas-nestjs'),
  PORT: z.coerce.number().default(3100),
  NODE_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development'),
});

export type Env = z.infer<typeof envSchema>;
