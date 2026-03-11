import { Injectable } from '@nestjs/common';
import { Resource } from '@rekog/mcp-nest';
import { DocumentationReaderService } from '@/mcp/data-access/services/documentation-reader.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';

@Injectable()
export class ConventionsResource {
  constructor(
    private readonly docReader: DocumentationReaderService,
    private readonly mcpLogger: McpLoggerService,
  ) {}

  @Resource({
    uri: 'alaz://conventions/api',
    name: 'API Conventions',
    description: 'API conventions: validation, pagination, errors, identifiers',
    mimeType: 'text/markdown',
  })
  async getApiConventions(): Promise<string> {
    this.mcpLogger.logResourceRead('alaz://conventions/api', {});
    const apiConv = await this.docReader.getApiConventions();
    const rules = await this.docReader.getCursorRules();
    const apiRule = rules['api-conventions.mdc'] ?? '';

    const parts: string[] = ['# API Conventions', ''];
    if (apiConv) parts.push(apiConv, '');
    if (apiRule) parts.push('## Cursor Rule', '', apiRule);
    const result = parts.join('\n') || 'Documentation not found.';
    this.mcpLogger.logResourceResult('alaz://conventions/api', result.length);
    return result;
  }

  @Resource({
    uri: 'alaz://conventions/testing',
    name: 'Testing Conventions',
    description: 'Testing patterns: AAA, sut, factories, in-memory repos',
    mimeType: 'text/markdown',
  })
  async getTestingConventions(): Promise<string> {
    this.mcpLogger.logResourceRead('alaz://conventions/testing', {});
    const testingDoc = await this.docReader.getTestingDocs();
    const rules = await this.docReader.getCursorRules();
    const testingRule = rules['testing-patterns.mdc'] ?? '';

    const parts: string[] = ['# Testing Conventions', ''];
    if (testingDoc) parts.push(testingDoc, '');
    if (testingRule) parts.push('## Cursor Rule', '', testingRule);
    const result = parts.join('\n') || 'Documentation not found.';
    this.mcpLogger.logResourceResult(
      'alaz://conventions/testing',
      result.length,
    );
    return result;
  }

  @Resource({
    uri: 'alaz://conventions/cqrs',
    name: 'CQRS Conventions',
    description: 'CQRS and Jobs: commands, events, BullMQ',
    mimeType: 'text/markdown',
  })
  async getCqrsConventions(): Promise<string> {
    this.mcpLogger.logResourceRead('alaz://conventions/cqrs', {});
    const cqrsDoc = await this.docReader.readDoc(
      'docs/architecture/CQRS-AND-JOBS.md',
    );
    const rules = await this.docReader.getCursorRules();
    const cqrsRule = rules['cqrs-and-jobs.mdc'] ?? '';

    const parts: string[] = ['# CQRS and Jobs', ''];
    if (cqrsDoc) parts.push(cqrsDoc, '');
    if (cqrsRule) parts.push('## Cursor Rule', '', cqrsRule);
    const result = parts.join('\n') || 'Documentation not found.';
    this.mcpLogger.logResourceResult('alaz://conventions/cqrs', result.length);
    return result;
  }
}
