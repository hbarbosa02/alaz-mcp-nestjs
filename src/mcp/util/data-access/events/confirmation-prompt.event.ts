/**
 * Header prepended to prompts that return executable steps.
 * Instructs the agent to ask the developer for confirmation before executing.
 */
export const EXECUTION_CONFIRMATION_HEADER = `> ⚠️ **EXECUTION REQUIRES DEVELOPER CONFIRMATION**
> Before executing any steps below, you MUST ask the developer: "Should I execute these changes?"
> Wait for explicit approval before proceeding.
>
> ---

`;

/**
 * Wraps content with the execution confirmation header.
 * Use for prompts that return executable steps (create-module, create-endpoint, update-documentation, investigate-bug).
 */
export function withConfirmationRequirement(content: string): string {
  return EXECUTION_CONFIRMATION_HEADER + content;
}

/**
 * Converts prompt text to MCP GetPromptResult format.
 * Prompts must return { messages: [...] } per the MCP spec.
 */
export function toPromptResult(text: string): {
  messages: { role: 'user'; content: { type: 'text'; text: string } }[];
} {
  return {
    messages: [{ role: 'user', content: { type: 'text', text } }],
  };
}
