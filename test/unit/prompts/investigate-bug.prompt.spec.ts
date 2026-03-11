import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { InvestigateBugPrompt } from '@/mcp/feature/prompts/investigate-bug.prompt';
import { EXECUTION_CONFIRMATION_HEADER } from '@/mcp/util/data-access/events/confirmation-prompt.event';

describe('InvestigateBugPrompt', () => {
  let sut: InvestigateBugPrompt;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvestigateBugPrompt],
    }).compile();

    sut = module.get(InvestigateBugPrompt);
  });

  it('should return prompt with confirmation header', async () => {
    const result = await sut.getPrompt({
      moduleName: 'user',
      bugDescription: 'Login fails',
    });

    expect(result).toContain(EXECUTION_CONFIRMATION_HEADER);
  });

  it('should include module name and bug description', async () => {
    const result = await sut.getPrompt({
      moduleName: 'auth',
      bugDescription: 'Token expired too soon',
    });

    expect(result).toContain('# Investigate bug in auth');
    expect(result).toContain('**Bug:** Token expired too soon');
  });

  it('should include recommended steps', async () => {
    const result = await sut.getPrompt({
      moduleName: 'user',
      bugDescription: 'Bug',
    });

    expect(result).toContain('alaz://modules/user');
    expect(result).toContain('get-entity-schema');
    expect(result).toContain('get-test-summary');
    expect(result).toContain('get-recent-changes');
    expect(result).toContain('alaz://conventions/api');
  });
});
