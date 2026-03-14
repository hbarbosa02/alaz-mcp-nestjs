/**
 * Asserts an adapter is registered for the given framework.
 * Use when getUnsupportedMessage returned falsy — adapters should exist.
 */
export function requireAdapter<T>(
  adapter: T | null | undefined,
  adapterName: string,
  framework: string | null,
): T {
  if (!adapter) {
    throw new Error(
      `${adapterName} not registered for ${framework ?? 'unknown'}. Check FrameworkAdapterRegistry.`,
    );
  }
  return adapter;
}
