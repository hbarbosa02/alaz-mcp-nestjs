import {
  EXECUTION_CONFIRMATION_HEADER,
  withConfirmationRequirement,
} from '@/mcp/util/data-access/events/confirmation-prompt.event';

describe('confirmation-prompt.util', () => {
  describe('EXECUTION_CONFIRMATION_HEADER', () => {
    it('should contain the confirmation warning text', () => {
      expect(EXECUTION_CONFIRMATION_HEADER).toContain('EXECUTION REQUIRES DEVELOPER CONFIRMATION');
      expect(EXECUTION_CONFIRMATION_HEADER).toContain('Should I execute these changes?');
    });
  });

  describe('withConfirmationRequirement', () => {
    it('should prepend the confirmation header to content', () => {
      const content = '# My content\n\nStep 1: Do something';
      const result = withConfirmationRequirement(content);

      expect(result).toContain(EXECUTION_CONFIRMATION_HEADER);
      expect(result).toContain(content);
      expect(result).toBe(EXECUTION_CONFIRMATION_HEADER + content);
    });

    it('should work with empty content', () => {
      const result = withConfirmationRequirement('');

      expect(result).toBe(EXECUTION_CONFIRMATION_HEADER);
    });
  });
});
