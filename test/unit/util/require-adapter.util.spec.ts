import { requireAdapter } from '@/mcp/util/require-adapter.util';

describe('requireAdapter', () => {
  it('should return adapter when defined', () => {
    const adapter = { name: 'test' };
    const result = requireAdapter(adapter, 'TestAdapter', 'nestjs');
    expect(result).toBe(adapter);
  });

  it('should throw when adapter is null', () => {
    expect(() => requireAdapter(null, 'EntityIntrospector', 'nestjs')).toThrow(
      'EntityIntrospector not registered for nestjs. Check FrameworkAdapterRegistry.',
    );
  });

  it('should throw when adapter is undefined', () => {
    expect(() => requireAdapter(undefined, 'ModuleRegistry', 'angular')).toThrow(
      'ModuleRegistry not registered for angular. Check FrameworkAdapterRegistry.',
    );
  });

  it('should use "unknown" when framework is null', () => {
    expect(() => requireAdapter(null, 'DocumentationReader', null)).toThrow(
      'DocumentationReader not registered for unknown. Check FrameworkAdapterRegistry.',
    );
  });
});
