import { Injectable, Optional, Inject } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { ProjectRootContextService } from '@/mcp/core/data-access/services/project-root-context.service';

export const EXEC_FILE_ASYNC = Symbol('EXEC_FILE_ASYNC');

export type ExecFileAsyncFn = (
  cmd: string,
  args: string[],
  opts: { cwd: string; timeout: number },
) => Promise<{ stdout: string; stderr: string }>;

export interface CommitInfo {
  hash: string;
  author: string;
  date: string;
  message: string;
  files: string[];
}

@Injectable()
export class GitContextService {
  private readonly timeout = 10000;
  private readonly execFileAsync: ExecFileAsyncFn;

  constructor(
    private readonly projectRootContext: ProjectRootContextService,
    @Optional() @Inject(EXEC_FILE_ASYNC) execFileOverride?: ExecFileAsyncFn,
  ) {
    this.execFileAsync =
      execFileOverride ?? (promisify(execFile) as ExecFileAsyncFn);
  }

  async getRecentCommits(days = 7): Promise<CommitInfo[]> {
    try {
      const projectRoot = this.projectRootContext.getProjectRoot();
      const { stdout } = await this.execFileAsync(
        'git',
        [
          'log',
          `--since=${days} days ago`,
          '--pretty=format:%H|||%an|||%ad|||%s',
          '--name-only',
          '--date=short',
        ],
        { cwd: projectRoot, timeout: this.timeout },
      );

      return this.parseGitLog(stdout);
    } catch {
      return [];
    }
  }

  async getModuleChanges(moduleName: string, days = 7): Promise<CommitInfo[]> {
    try {
      const { stdout } = await this.execFileAsync(
        'git',
        [
          'log',
          `--since=${days} days ago`,
          '--pretty=format:%H|||%an|||%ad|||%s',
          '--name-only',
          '--date=short',
          '--',
          `src/${moduleName}/`,
        ],
        {
          cwd: this.projectRootContext.getProjectRoot(),
          timeout: this.timeout,
        },
      );

      return this.parseGitLog(stdout);
    } catch {
      return [];
    }
  }

  async getDiff(ref?: string): Promise<string> {
    try {
      const args = ref ? ['diff', ref] : ['diff'];
      const { stdout } = await this.execFileAsync('git', args, {
        cwd: this.projectRootContext.getProjectRoot(),
        timeout: this.timeout,
      });
      return stdout;
    } catch {
      return '';
    }
  }

  async getTags(sortOrder: 'asc' | 'desc' = 'desc'): Promise<string[]> {
    try {
      const sortFlag =
        sortOrder === 'asc' ? 'version:refname' : '-version:refname';
      const { stdout } = await this.execFileAsync(
        'git',
        ['tag', '--sort=' + sortFlag],
        {
          cwd: this.projectRootContext.getProjectRoot(),
          timeout: this.timeout,
        },
      );
      return stdout
        .split('\n')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    } catch {
      return [];
    }
  }

  async getCommitsBetween(
    fromRef?: string,
    toRef?: string,
  ): Promise<CommitInfo[]> {
    try {
      const args = [
        'log',
        '--pretty=format:%H|||%an|||%ad|||%s',
        '--name-only',
        '--date=short',
      ];

      if (fromRef !== undefined && toRef !== undefined) {
        args.push(`${fromRef}..${toRef}`);
      } else if (toRef !== undefined) {
        args.push(toRef);
      } else if (fromRef !== undefined) {
        args.push(`${fromRef}..HEAD`);
      }

      const { stdout } = await this.execFileAsync('git', args, {
        cwd: this.projectRootContext.getProjectRoot(),
        timeout: this.timeout,
      });

      return this.parseGitLog(stdout);
    } catch {
      return [];
    }
  }

  async getTagDate(tag: string): Promise<string | null> {
    try {
      const { stdout } = await this.execFileAsync(
        'git',
        ['log', '-1', '--format=%ad', '--date=short', tag],
        {
          cwd: this.projectRootContext.getProjectRoot(),
          timeout: this.timeout,
        },
      );
      const date = stdout.trim();
      return date.length > 0 ? date : null;
    } catch {
      return null;
    }
  }

  private parseGitLog(output: string): CommitInfo[] {
    const commits: CommitInfo[] = [];
    const trimmed = output.trim();
    if (trimmed.length === 0) return commits;
    const blocks = trimmed.split(/\n(?=[a-f0-9]{40}\|\|\|)/);

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length === 0) continue;

      const [hash, author, date, message] = lines[0].split('|||');
      const files = lines.slice(1).filter((f) => f.trim().length > 0);

      commits.push({
        hash: hash?.trim() ?? '',
        author: author?.trim() ?? '',
        date: date?.trim() ?? '',
        message: message?.trim() ?? '',
        files,
      });
    }

    return commits;
  }
}
