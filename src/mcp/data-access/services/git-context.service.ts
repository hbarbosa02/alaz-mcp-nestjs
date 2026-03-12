import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface CommitInfo {
  hash: string;
  author: string;
  date: string;
  message: string;
  files: string[];
}

@Injectable()
export class GitContextService {
  private readonly projectRoot: string;
  private readonly timeout = 10000;

  constructor(private readonly config: ConfigService) {
    this.projectRoot = this.config.getOrThrow<string>('PROJECT_ROOT');
  }

  async getRecentCommits(days = 7): Promise<CommitInfo[]> {
    try {
      const { stdout } = await execFileAsync(
        'git',
        [
          'log',
          `--since=${days} days ago`,
          '--pretty=format:%H|||%an|||%ad|||%s',
          '--name-only',
          '--date=short',
        ],
        { cwd: this.projectRoot, timeout: this.timeout },
      );

      return this.parseGitLog(stdout);
    } catch {
      return [];
    }
  }

  async getModuleChanges(moduleName: string, days = 7): Promise<CommitInfo[]> {
    try {
      const { stdout } = await execFileAsync(
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
        { cwd: this.projectRoot, timeout: this.timeout },
      );

      return this.parseGitLog(stdout);
    } catch {
      return [];
    }
  }

  async getDiff(ref?: string): Promise<string> {
    try {
      const args = ref ? ['diff', ref] : ['diff'];
      const { stdout } = await execFileAsync('git', args, {
        cwd: this.projectRoot,
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
      const { stdout } = await execFileAsync(
        'git',
        ['tag', '--sort=' + sortFlag],
        { cwd: this.projectRoot, timeout: this.timeout },
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

      const { stdout } = await execFileAsync('git', args, {
        cwd: this.projectRoot,
        timeout: this.timeout,
      });

      return this.parseGitLog(stdout);
    } catch {
      return [];
    }
  }

  async getTagDate(tag: string): Promise<string | null> {
    try {
      const { stdout } = await execFileAsync(
        'git',
        ['log', '-1', '--format=%ad', '--date=short', tag],
        { cwd: this.projectRoot, timeout: this.timeout },
      );
      const date = stdout.trim();
      return date.length > 0 ? date : null;
    } catch {
      return null;
    }
  }

  private parseGitLog(output: string): CommitInfo[] {
    const commits: CommitInfo[] = [];
    const blocks = output.split(/\n(?=[a-f0-9]{40}\|\|\|)/);

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
