import { Injectable } from '@nestjs/common';
import { ResourceTemplate } from '@rekog/mcp-nest';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';

@Injectable()
export class EntityDiagramResource {
  constructor(
    private readonly frameworkDetector: FrameworkDetectorService,
    private readonly adapterRegistry: FrameworkAdapterRegistryService,
    private readonly mcpLogger: McpLoggerService,
  ) {}

  @ResourceTemplate({
    uriTemplate: 'alaz://entities/{entityName}',
    name: 'Entity Schema',
    description: 'Entity schema and relationships',
    mimeType: 'text/markdown',
  })
  async getEntityDiagram(params: { entityName: string }): Promise<string> {
    const uri = `alaz://entities/${params.entityName}`;
    this.mcpLogger.logResourceRead(uri, params);
    const framework = await this.frameworkDetector.detect();
    const unsupportedMsg =
      this.adapterRegistry.getUnsupportedMessage(framework);
    if (unsupportedMsg) {
      this.mcpLogger.logResourceResult(uri, unsupportedMsg.length);
      return unsupportedMsg;
    }
    const entityIntrospector =
      this.adapterRegistry.getEntityIntrospector(framework)!;
    const schema = await entityIntrospector.getEntitySchema(params.entityName);
    if (!schema) {
      const notFoundMsg = `Entity "${params.entityName}" not found.`;
      this.mcpLogger.logResourceResult(uri, notFoundMsg.length);
      return notFoundMsg;
    }

    const lines: string[] = [
      `# Entity: ${schema.name}`,
      `File: \`${schema.filePath}\``,
      schema.tableName ? `Table: \`${schema.tableName}\`` : '',
      '',
      '## Properties',
      '| Name | Type | Nullable | Unique |',
      '|------|------|----------|--------|',
    ];

    for (const p of schema.properties) {
      lines.push(`| ${p.name} | ${p.type} | ${p.nullable} | ${p.unique} |`);
    }

    if (schema.relations.length > 0) {
      lines.push('', '## Relations');
      lines.push('| Name | Type | Target |');
      lines.push('|------|------|--------|');
      for (const r of schema.relations) {
        lines.push(`| ${r.name} | ${r.type} | ${r.targetEntity} |`);
      }

      lines.push('', '## ER Diagram (Mermaid)');
      lines.push('```mermaid');
      lines.push('erDiagram');
      lines.push(`  ${schema.name} {`);
      for (const p of schema.properties.slice(0, 5)) {
        lines.push(`    ${p.type} ${p.name}`);
      }
      lines.push('  }');
      for (const r of schema.relations) {
        const rel =
          r.type === 'ManyToOne'
            ? '}o||'
            : r.type === 'OneToMany'
              ? '||o{'
              : '}o{';
        lines.push(`  ${schema.name} ${rel} ${r.targetEntity} : "${r.name}"`);
      }
      lines.push('```');
    }

    const result = lines.join('\n');
    this.mcpLogger.logResourceResult(uri, result.length);
    return result;
  }
}
