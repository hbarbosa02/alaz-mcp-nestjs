import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

@Injectable()
export class McpLoggerService {
  private readonly logger = new Logger(McpLoggerService.name);
  private readonly logDir: string;

  constructor() {
    this.logDir = path.join(os.tmpdir(), 'alaz-mcp-logs');
  }

  private getLogFilePath(): string {
    const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return path.join(this.logDir, `mcp-${dateStr}.log`);
  }

  private formatParams(params: Record<string, unknown>): string {
    return Object.entries(params)
      .map(([key, value]) => `  ${key}: ${JSON.stringify(value)}`)
      .join('\n');
  }

  private appendToFile(content: string): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
      fs.appendFileSync(this.getLogFilePath(), content);
    } catch (err) {
      this.logger.warn('Failed to write log to file', err);
    }
  }

  logPromptReceived(name: string, args: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const argsFormatted = this.formatParams(args);

    this.logger.log(`Prompt received: ${name}\n${argsFormatted}`);

    const fileEntry = [
      `[${timestamp}] PROMPT RECEIVED: ${name}`,
      argsFormatted,
      '---',
    ].join('\n');

    this.appendToFile(fileEntry);
  }

  logPromptResult(name: string, resultLength: number): void {
    const timestamp = new Date().toISOString();

    this.logger.log(`Prompt completed: ${name} (${resultLength} characters)`);

    const fileEntry = `[${timestamp}] PROMPT COMPLETED: ${name} (${resultLength} characters)\n---\n`;
    this.appendToFile(fileEntry);
  }

  logToolInvoked(name: string, args: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const argsFormatted = this.formatParams(args);

    this.logger.log(`Tool invoked: ${name}\n${argsFormatted}`);

    const fileEntry = [
      `[${timestamp}] TOOL INVOKED: ${name}`,
      argsFormatted,
      '---',
    ].join('\n');

    this.appendToFile(fileEntry);
  }

  logToolResult(name: string, resultLength: number): void {
    const timestamp = new Date().toISOString();

    this.logger.log(`Tool completed: ${name} (${resultLength} characters)`);

    const fileEntry = `[${timestamp}] TOOL COMPLETED: ${name} (${resultLength} characters)\n---\n`;
    this.appendToFile(fileEntry);
  }

  logResourceRead(uri: string, params: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const paramsFormatted = this.formatParams(params);

    this.logger.log(`Resource read: ${uri}\n${paramsFormatted}`);

    const fileEntry = [
      `[${timestamp}] RESOURCE READ: ${uri}`,
      paramsFormatted,
      '---',
    ].join('\n');

    this.appendToFile(fileEntry);
  }

  logResourceResult(uri: string, resultLength: number): void {
    const timestamp = new Date().toISOString();

    this.logger.log(`Resource completed: ${uri} (${resultLength} characters)`);

    const fileEntry = `[${timestamp}] RESOURCE COMPLETED: ${uri} (${resultLength} characters)\n---\n`;
    this.appendToFile(fileEntry);
  }
}
