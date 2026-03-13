import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { GitContextService } from '@/mcp/data-access/services/git-context.service';
import { McpLoggerService } from '@/mcp/data-access/services/mcp-logger.service';
import { ProjectRootContextService } from '@/mcp/data-access/services/project-root-context.service';

const projectRootParam = z
  .string()
  .optional()
  .describe('Path to NestJS project root. Overrides MCP config.');

@Injectable()
export class RecentChangesTool {
  constructor(
    private readonly gitContext: GitContextService,
    private readonly mcpLogger: McpLoggerService,
    private readonly projectRootContext: ProjectRootContextService,
  ) {}

  @Tool({
    name: 'get-recent-changes',
    description: 'Recent git changes (commits, files, authors)',
    parameters: z.object({
      days: z.number().default(7).describe('Number of days to fetch'),
      projectRoot: projectRootParam,
    }),
  })
  async getRecentChanges(params: {
    days: number;
    projectRoot?: string;
  }): Promise<string> {
    const doWork = async () => {
    this.mcpLogger.logToolInvoked('get-recent-changes', params);
    const commits = await this.gitContext.getRecentCommits(params.days);

    if (commits.length === 0) {
      const emptyMsg = `No commits in the last ${params.days} days.`;
      this.mcpLogger.logToolResult('get-recent-changes', emptyMsg.length);
      return emptyMsg;
    }

    const lines = [`# Commits (last ${params.days} days)`, ''];
    for (const c of commits) {
      lines.push(`## ${c.hash.slice(0, 7)} - ${c.message}`);
      lines.push(`- Author: ${c.author}`);
      lines.push(`- Date: ${c.date}`);
      if (c.files.length > 0) {
        lines.push(
          `- Files: ${c.files.slice(0, 5).join(', ')}${c.files.length > 5 ? '...' : ''}`,
        );
      }
      lines.push('');
    }
    const result = lines.join('\n');
    this.mcpLogger.logToolResult('get-recent-changes', result.length);
    return result;
    };
    if (params.projectRoot) {
      return this.projectRootContext.run(params.projectRoot, doWork);
    }
    return doWork();
  }
}
