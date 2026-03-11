import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Injectable()
export class PathResolverService {
  private readonly projectRoot: string;

  constructor(private readonly config: ConfigService) {
    this.projectRoot = this.config.getOrThrow<string>('PROJECT_ROOT');
  }

  resolve(...segments: string[]): string {
    return path.join(this.projectRoot, ...segments);
  }

  get root(): string {
    return this.projectRoot;
  }
}
