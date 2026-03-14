/**
 * Static parsing utilities for TypeScript files using regex.
 * Used to extract decorators, class names, and MikroORM entity metadata
 * without requiring a full TypeScript compiler.
 */

export interface DecoratorMatch {
  name: string;
  args: string;
  fullMatch: string;
}

export function extractDecorators(content: string, decoratorName?: string): DecoratorMatch[] {
  const matches: DecoratorMatch[] = [];
  let m: RegExpExecArray | null;

  const regex = new RegExp(
    decoratorName ? `@${decoratorName}\\s*(?:\\(([^)]*)\\))?` : '@(\\w+)\\s*(?:\\(([^)]*)\\))?',
    'g',
  );

  while ((m = regex.exec(content)) !== null) {
    matches.push({
      name: decoratorName ?? m[1],
      args: (m[2] ?? '').trim(),
      fullMatch: m[0],
    });
  }
  return matches;
}

export function extractClassNames(content: string): string[] {
  const matches: string[] = [];
  const regex = /(?:export\s+)?class\s+(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content)) !== null) {
    matches.push(m[1]);
  }
  return matches;
}

export interface MikroORMProperty {
  name: string;
  type: string;
  decorator: string;
  nullable: boolean;
  unique: boolean;
}

export interface MikroORMRelation {
  name: string;
  type: string;
  targetEntity: string;
  inversedBy?: string;
  mappedBy?: string;
}

export function extractMikroORMProperties(content: string): {
  properties: MikroORMProperty[];
  relations: MikroORMRelation[];
} {
  const properties: MikroORMProperty[] = [];
  const relations: MikroORMRelation[] = [];

  // @Property(), @Property({ nullable: true }), @Property({ unique: true })
  const propRegex =
    /@Property\s*(?:\(\s*\{([^}]*)\}\s*\))?\s*(?:@\w+[^@]*)*\s*(?:readonly\s+)?(\w+)\s*[?:!]?\s*:\s*(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = propRegex.exec(content)) !== null) {
    const opts = m[1] ?? '';
    properties.push({
      name: m[2],
      type: m[3],
      decorator: '@Property',
      nullable: opts.includes('nullable'),
      unique: opts.includes('unique'),
    });
  }

  // @ManyToOne(() => Entity), @OneToMany(() => Entity, e => e.field)
  const relationTypes = ['ManyToOne', 'OneToMany', 'ManyToMany', 'OneToOne'];
  for (const relType of relationTypes) {
    const relRegex = new RegExp(
      `@${relType}\\s*\\(\\s*\\(\\)\\s*=>\\s*([\\w]+)(?:[^)]*inversedBy\\s*[:=]\\s*['"]?([\\w]+)['"]?)?(?:[^)]*mappedBy\\s*[:=]\\s*['"]?([\\w]+)['"]?)?[^)]*\\)\\s*(?:@\\w+[^@]*)*\\s*(?:readonly\\s+)?([\\w]+)`,
      'g',
    );
    while ((m = relRegex.exec(content)) !== null) {
      relations.push({
        name: m[4],
        type: relType,
        targetEntity: m[1],
        inversedBy: m[2],
        mappedBy: m[3],
      });
    }
  }

  return { properties, relations };
}

export function extractImports(content: string): { from: string; specifiers: string[] }[] {
  const imports: { from: string; specifiers: string[] }[] = [];
  const regex = /import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content)) !== null) {
    const specifiers = m[1]
      ? m[1].split(',').map((s) =>
          s
            .trim()
            .split(/\s+as\s+/)[0]
            .trim(),
        )
      : [m[2]];
    imports.push({ from: m[3], specifiers });
  }
  return imports;
}

export function extractEntityTableName(content: string): string | null {
  const m = content.match(/@Entity\s*\(\s*\{\s*tableName\s*:\s*['"]([^'"]+)['"]/);
  return m ? m[1] : null;
}
