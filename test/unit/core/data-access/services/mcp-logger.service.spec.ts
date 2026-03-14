import { Test } from '@nestjs/testing';
import * as fs from 'fs';
import { McpLoggerService } from '@/mcp/core/data-access/services/mcp-logger.service';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  appendFileSync: jest.fn(),
}));

describe('McpLoggerService', () => {
  let sut: McpLoggerService;
  let logSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.mocked(fs.existsSync).mockReturnValue(true);
    jest.mocked(fs.mkdirSync).mockImplementation();
    jest.mocked(fs.appendFileSync).mockImplementation();

    const module = await Test.createTestingModule({
      providers: [McpLoggerService],
    }).compile();

    sut = module.get(McpLoggerService);
    logSpy = jest.spyOn(sut['logger'], 'log').mockImplementation();
    jest.spyOn(sut['logger'], 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log prompt received', () => {
    sut.logPromptReceived('create-module', { moduleName: 'billing' });

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Prompt received: create-module'),
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('moduleName'));
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('PROMPT RECEIVED: create-module'),
    );
  });

  it('should log prompt result', () => {
    sut.logPromptResult('create-module', 150);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Prompt completed: create-module (150 characters)',
      ),
    );
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining(
        'PROMPT COMPLETED: create-module (150 characters)',
      ),
    );
  });

  it('should log tool invoked', () => {
    sut.logToolInvoked('list-modules', { projectRoot: '/path' });

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Tool invoked: list-modules'),
    );
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('TOOL INVOKED: list-modules'),
    );
  });

  it('should log tool result', () => {
    sut.logToolResult('list-modules', 200);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Tool completed: list-modules (200 characters)'),
    );
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('TOOL COMPLETED: list-modules (200 characters)'),
    );
  });

  it('should log resource read', () => {
    sut.logResourceRead('alaz://onboarding', { projectRoot: '/path' });

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Resource read: alaz://onboarding'),
    );
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('RESOURCE READ: alaz://onboarding'),
    );
  });

  it('should log resource result', () => {
    sut.logResourceResult('alaz://onboarding', 300);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Resource completed: alaz://onboarding (300 characters)',
      ),
    );
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining(
        'RESOURCE COMPLETED: alaz://onboarding (300 characters)',
      ),
    );
  });

  it('should create log dir when it does not exist', () => {
    jest.mocked(fs.existsSync).mockReturnValue(false);

    sut.logPromptReceived('test', {});

    expect(fs.mkdirSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ recursive: true }),
    );
  });

  it('should call logger.warn when appendFileSync throws', () => {
    const warnSpy = jest.spyOn(sut['logger'], 'warn').mockImplementation();
    jest.mocked(fs.appendFileSync).mockImplementation(() => {
      throw new Error(
        'Simulated appendFileSync failure for McpLoggerService file write test',
      );
    });

    sut.logPromptReceived('test', {});

    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to write log to file',
      expect.any(Error),
    );
  });
});
