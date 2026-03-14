import { Injectable } from '@nestjs/common';
import { FileReaderService } from '@/mcp/core/data-access/services/file-reader.service';
import type { ICodebaseAnalyzer } from '@/mcp/core/ports/codebase-analyzer.port';
import type { EndpointInfo } from '@/mcp/core/ports/types';

export type { EndpointInfo };

@Injectable()
export class CodebaseAnalyzerService implements ICodebaseAnalyzer {
  constructor(private readonly fileReader: FileReaderService) {}

  async getEndpoints(moduleName?: string): Promise<EndpointInfo[]> {
    const pattern = moduleName ? `src/${moduleName}/**/*.controller.ts` : 'src/**/*.controller.ts';
    const files = await this.fileReader.readGlob(pattern);
    const endpoints: EndpointInfo[] = [];

    for (const filePath of files) {
      const modName = this.extractModuleNameFromPath(filePath);
      const content = await this.fileReader.readFile(filePath);
      if (!content) continue;

      const controllerPath = this.extractControllerPath(content);
      const controllerTag = this.extractApiTags(content);
      const authType = this.extractAuthType(content);

      const methodRegex = /@(Get|Post|Patch|Delete|Put)\s*(?:\(\s*['"]([^'"]*)['"]\s*\))?/g;
      let m: RegExpExecArray | null;
      while ((m = methodRegex.exec(content)) !== null) {
        const method = m[1].toUpperCase();
        const methodPath = (m[2] ?? '').trim();
        const fullPath = controllerPath + (methodPath ? `/${methodPath}`.replace(/\/+/g, '/') : '');
        const permissions = this.extractPermissionsForMethod(content, m.index);

        endpoints.push({
          method,
          path: fullPath || '/',
          controllerClass: this.extractControllerClass(content),
          controllerTag: controllerTag ?? modName,
          permissions,
          authType,
          moduleName: modName,
        });
      }
    }

    return endpoints;
  }

  getModuleEndpoints(moduleName: string): Promise<EndpointInfo[]> {
    return this.getEndpoints(moduleName);
  }

  private extractModuleNameFromPath(filePath: string): string {
    const m = filePath.match(/src\/([^/]+)/);
    return m ? m[1] : 'unknown';
  }

  private extractControllerPath(content: string): string {
    const m = content.match(/@Controller\s*\(\s*['"]([^'"]*)['"]\s*\)/);
    const path = m ? m[1].trim() : '';
    return path.startsWith('/') ? path : `/${path}`;
  }

  private extractApiTags(content: string): string | null {
    const m = content.match(/@ApiTags\s*\(\s*['"]([^'"]*)['"]\s*\)/);
    return m ? m[1] : null;
  }

  private extractAuthType(content: string): string {
    if (content.includes('@Auth(AuthType.None)')) return 'None';
    if (content.includes('@Auth(AuthType.Jwt)')) return 'Jwt';
    if (content.includes('@Auth(AuthType.Auth0)')) return 'Auth0';
    return 'Default';
  }

  private extractControllerClass(content: string): string {
    const m = content.match(/class\s+(\w+Controller)/);
    return m ? m[1] : 'UnknownController';
  }

  private extractPermissionsForMethod(content: string, methodIndex: number): string[] {
    const beforeMethod = content.substring(0, methodIndex);
    const permMatches = beforeMethod.match(/@Permissions\s*\(\s*([^)]+)\s*\)/g);
    if (!permMatches) return [];
    const lastMatch = permMatches[permMatches.length - 1];
    const args = lastMatch.match(/@Permissions\s*\(\s*([^)]+)\s*\)/)?.[1] ?? '';
    return args
      .split(',')
      .map((s) => s.trim().replace(/PermissionCode\./g, ''))
      .filter(Boolean);
  }
}
