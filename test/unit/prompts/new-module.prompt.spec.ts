import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NewModulePrompt } from '@/mcp/feature/prompts/new-module.prompt';
import { EXECUTION_CONFIRMATION_HEADER } from '@/mcp/util/data-access/events/confirmation-prompt.event';

describe('NewModulePrompt', () => {
  let sut: NewModulePrompt;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NewModulePrompt],
    }).compile();

    sut = module.get(NewModulePrompt);
  });

  it('should return prompt with confirmation header', async () => {
    const result = await sut.getPrompt({
      moduleName: 'billing',
      hasController: true,
      hasEntity: true,
    });

    expect(result).toContain(EXECUTION_CONFIRMATION_HEADER);
  });

  it('should include entity section when hasEntity is true', async () => {
    const result = await sut.getPrompt({
      moduleName: 'notification',
      hasController: false,
      hasEntity: true,
    });

    expect(result).toContain('## 3. Entity');
    expect(result).toContain('@Entity()');
  });

  it('should include controller section when hasController is true', async () => {
    const result = await sut.getPrompt({
      moduleName: 'billing',
      hasController: true,
      hasEntity: false,
    });

    expect(result).toContain('## 4. Controller');
    expect(result).toContain('@ApiTags');
    expect(result).toContain('billing.controller.ts');
  });

  it('should include folder structure with module name', async () => {
    const result = await sut.getPrompt({
      moduleName: 'my-module',
      hasController: true,
      hasEntity: true,
    });

    expect(result).toContain('src/my-module/');
    expect(result).toContain('my-module.module.ts');
  });
});
