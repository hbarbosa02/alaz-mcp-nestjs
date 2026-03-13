import { Injectable } from '@nestjs/common';
import type { CommitInfo } from './git-context.service';
import { GitContextService } from './git-context.service';

const CONVENTIONAL_COMMIT_REGEX =
  /^(feat|fix|docs|chore|refactor|style|test|perf)(\(.+\))?:\s*(.+)$/i;

const TYPE_TO_SECTION: Record<string, string> = {
  feat: 'Added',
  fix: 'Fixed',
  docs: 'Documentation',
  chore: 'Other',
  refactor: 'Changed',
  style: 'Changed',
  test: 'Other',
  perf: 'Changed',
};

@Injectable()
export class GitChangelogService {
  constructor(private readonly gitContext: GitContextService) {}

  async generateChangelog(): Promise<string | null> {
    try {
      const tags = await this.gitContext.getTags('asc');
      const lines: string[] = ['# Changelog', ''];

      if (tags.length === 0) {
        const commits = await this.gitContext.getCommitsBetween(undefined, 'HEAD');
        lines.push('## [Unreleased]', '');
        lines.push(...this.formatCommits(commits));
        return lines.join('\n').trim() || null;
      }

      const unreleasedCommits = await this.gitContext.getCommitsBetween(
        tags[tags.length - 1],
        'HEAD',
      );
      if (unreleasedCommits.length > 0) {
        lines.push('## [Unreleased]', '');
        lines.push(...this.formatCommits(unreleasedCommits));
        lines.push('');
      }

      for (let i = tags.length - 1; i >= 0; i--) {
        const tag = tags[i];
        const prevTag = i > 0 ? tags[i - 1] : undefined;
        const commits = await this.gitContext.getCommitsBetween(prevTag, tag);

        if (commits.length === 0) continue;

        const date = await this.gitContext.getTagDate(tag);
        const dateSuffix = date ? ` - ${date}` : '';
        lines.push(`## [${tag}]${dateSuffix}`, '');
        lines.push(...this.formatCommits(commits));
        lines.push('');
      }

      return lines.join('\n').trim() || null;
    } catch {
      return null;
    }
  }

  private formatCommits(commits: CommitInfo[]): string[] {
    const bySection = new Map<string, string[]>();

    for (const c of commits) {
      const match = c.message.match(CONVENTIONAL_COMMIT_REGEX);
      const section = match
        ? TYPE_TO_SECTION[match[1].toLowerCase()] ?? 'Other'
        : 'Other';

      if (!bySection.has(section)) {
        bySection.set(section, []);
      }
      const displayMessage = match ? match[3].trim() : c.message;
      bySection.get(section)!.push(`- ${displayMessage}`);
    }

    const sectionOrder = ['Added', 'Changed', 'Fixed', 'Documentation', 'Other'];
    const result: string[] = [];

    for (const section of sectionOrder) {
      const items = bySection.get(section);
      if (!items || items.length === 0) continue;

      if (section !== 'Other' || bySection.size > 1) {
        result.push(`### ${section}`, '');
      }
      result.push(...items);
      result.push('');
    }

    const remaining = [...bySection.keys()].filter(
      (s) => !sectionOrder.includes(s),
    );
    for (const section of remaining) {
      const items = bySection.get(section)!;
      result.push(`### ${section}`, '');
      result.push(...items);
      result.push('');
    }

    return result.length > 0 ? result.slice(0, -1) : [];
  }
}
