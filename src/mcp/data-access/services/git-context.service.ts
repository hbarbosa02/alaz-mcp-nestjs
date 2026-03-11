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
