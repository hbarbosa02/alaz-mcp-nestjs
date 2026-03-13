import { Injectable } from '@nestjs/common';
import { Resource } from '@rekog/mcp-nest';
import { FrameworkDetectorService } from '@/mcp/core/data-access/services/framework-detector.service';
import { toReadResourceResult } from '@/mcp/core/util/read-resource-result.util';
import { FrameworkAdapterRegistryService } from '@/mcp/domain/nestjs/data-access/services/framework-adapter-registry.service';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';

@Injectable()
export class ConventionsResource {
  constructor(
    private readonly frameworkDetector: FrameworkDetectorService,
    private readonly adapterRegistry: FrameworkAdapterRegistryService,
    private readonly mcpLogger: McpLoggerService,
  ) {}

  @Resource({
    uri: 'alaz://conventions/api',
    name: 'API Conventions',
    description: 'API conventions: validation, pagination, errors, identifiers',
    mimeType: 'text/markdown',
  })
  async getApiConventions() {
    this.mcpLogger.logResourceRead('alaz://conventions/api', {});
    const framework = await this.frameworkDetector.detect();
    const unsupportedMsg =
      this.adapterRegistry.getUnsupportedMessage(framework);
    if (unsupportedMsg) {
      this.mcpLogger.logResourceResult(
        'alaz://conventions/api',
        unsupportedMsg.length,
      );
      return toReadResourceResult(
        'alaz://conventions/api',
        'text/markdown',
        unsupportedMsg,
      );
    }
    const docReader = this.adapterRegistry.getDocumentationReader(framework)!;
    const apiConv = await docReader.getApiConventions();
    const rules = await docReader.getCursorRules();
    const apiRule = rules['api-conventions.mdc'] ?? '';

    const parts: string[] = ['# API Conventions', ''];
    if (apiConv) parts.push(apiConv, '');
    if (apiRule) parts.push('## Cursor Rule', '', apiRule);
    const result = parts.join('\n') || 'Documentation not found.';
    this.mcpLogger.logResourceResult('alaz://conventions/api', result.length);
    return toReadResourceResult(
      'alaz://conventions/api',
      'text/markdown',
      result,
    );
  }

  @Resource({
    uri: 'alaz://conventions/testing',
    name: 'Testing Conventions',
    description: 'Testing patterns: AAA, sut, factories, in-memory repos',
    mimeType: 'text/markdown',
  })
  async getTestingConventions() {
    this.mcpLogger.logResourceRead('alaz://conventions/testing', {});
    const framework = await this.frameworkDetector.detect();
    const unsupportedMsg =
      this.adapterRegistry.getUnsupportedMessage(framework);
    if (unsupportedMsg) {
      this.mcpLogger.logResourceResult(
        'alaz://conventions/testing',
        unsupportedMsg.length,
      );
      return toReadResourceResult(
        'alaz://conventions/testing',
        'text/markdown',
        unsupportedMsg,
      );
    }
    const docReader = this.adapterRegistry.getDocumentationReader(framework)!;
    const testingDoc = await docReader.getTestingDocs();
    const rules = await docReader.getCursorRules();
    const testingRule = rules['testing-patterns.mdc'] ?? '';

    const parts: string[] = ['# Testing Conventions', ''];
    if (testingDoc) parts.push(testingDoc, '');
    if (testingRule) parts.push('## Cursor Rule', '', testingRule);
    const result = parts.join('\n') || 'Documentation not found.';
    this.mcpLogger.logResourceResult(
      'alaz://conventions/testing',
      result.length,
    );
    return toReadResourceResult(
      'alaz://conventions/testing',
      'text/markdown',
      result,
    );
  }

  @Resource({
    uri: 'alaz://conventions/cqrs',
    name: 'CQRS Conventions',
    description: 'CQRS and Jobs: commands, events, BullMQ',
    mimeType: 'text/markdown',
  })
  async getCqrsConventions() {
    this.mcpLogger.logResourceRead('alaz://conventions/cqrs', {});
    const framework = await this.frameworkDetector.detect();
    const unsupportedMsg =
      this.adapterRegistry.getUnsupportedMessage(framework);
    if (unsupportedMsg) {
      this.mcpLogger.logResourceResult(
        'alaz://conventions/cqrs',
        unsupportedMsg.length,
      );
      return toReadResourceResult(
        'alaz://conventions/cqrs',
        'text/markdown',
        unsupportedMsg,
      );
    }
    const docReader = this.adapterRegistry.getDocumentationReader(framework)!;
    const cqrsDoc = await docReader.readDoc(
      'docs/architecture/CQRS-AND-JOBS.md',
    );
    const rules = await docReader.getCursorRules();
    const cqrsRule = rules['cqrs-and-jobs.mdc'] ?? '';

    const parts: string[] = ['# CQRS and Jobs', ''];
    if (cqrsDoc) parts.push(cqrsDoc, '');
    if (cqrsRule) parts.push('## Cursor Rule', '', cqrsRule);
    const result = parts.join('\n') || 'Documentation not found.';
    this.mcpLogger.logResourceResult('alaz://conventions/cqrs', result.length);
    return toReadResourceResult(
      'alaz://conventions/cqrs',
      'text/markdown',
      result,
    );
  }
}
