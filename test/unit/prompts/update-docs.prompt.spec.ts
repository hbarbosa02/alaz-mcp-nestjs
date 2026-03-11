import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { UpdateDocsPrompt } from '@/mcp/feature/prompts/update-docs.prompt';
import { EXECUTION_CONFIRMATION_HEADER } from '@/mcp/util/data-access/events/confirmation-prompt.event';

describe('UpdateDocsPrompt', () => {
  let sut: UpdateDocsPrompt;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateDocsPrompt],
    }).compile();

    sut = module.get(UpdateDocsPrompt);
  });

  it('should return prompt with confirmation header', async () => {
    const result = await sut.getPrompt({ moduleName: 'user' });

    expect(result).toContain(EXECUTION_CONFIRMATION_HEADER);
  });

  it('should include module name in content', async () => {
    const result = await sut.getPrompt({ moduleName: 'tenant' });

    expect(result).toContain('# Update documentation: tenant');
    expect(result).toContain('alaz://modules/tenant');
  });

  it('should include mapping table and steps', async () => {
    const result = await sut.getPrompt({ moduleName: 'account' });

    expect(result).toContain('## 1. Check current state');
    expect(result).toContain('## 3. Module -> doc mapping');
    expect(result).toContain('docs/features/ACCOUNT.md');
    expect(result).toContain('## 5. Changelog');
  });
});
