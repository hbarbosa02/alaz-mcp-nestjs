import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { PathResolverService } from '@/mcp/core/data-access/services/path-resolver.service';

@Injectable()
export class FileReaderService {
  constructor(private readonly pathResolver: PathResolverService) {}

  async readFile(relativePath: string): Promise<string | null> {
    try {
      const fullPath = this.pathResolver.resolve(relativePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      return content;
    } catch {
      return null;
    }
  }

  async readDir(relativePath: string): Promise<string[]> {
    try {
      const fullPath = this.pathResolver.resolve(relativePath);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      return entries.map((e) => e.name);
    } catch {
      return [];
    }
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      const fullPath = this.pathResolver.resolve(relativePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async readGlob(pattern: string): Promise<string[]> {
    try {
      const fullPattern = this.pathResolver.resolve(pattern);
      const files = await glob(fullPattern, { nodir: true });
      const root = this.pathResolver.root;
      return files.map((f) => path.relative(root, f));
    } catch {
      return [];
    }
  }
}
