# Alaz MCP Server — Flows, Diagrams & Architecture Report

MCP Server that exposes the live context of any NestJS project to AI agents (Cursor, Claude Desktop, etc.). This document describes the architecture, data flows, and applications.

> **Viewing Mermaid diagrams**: The preview in Cursor/VSCode requires the [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) extension. Install it and reopen the preview. On GitHub, diagrams render natively.

## 1. Architecture Overview

```mermaid
flowchart TB
    subgraph Client["AI Agent Layer"]
        Cursor["Cursor"]
        Claude["Claude Desktop"]
        Copilot["GitHub Copilot"]
    end

    subgraph Transport["Transport Layer"]
        HTTP["Streamable HTTP<br/>:3100/mcp"]
        SSE["Server-Sent Events"]
        STDIO["STDIO Process"]
    end

    subgraph MCP["Alaz MCP Server"]
        subgraph Feature["MCP Feature Layer"]
            Tools["Tools (7)"]
            Resources["Resources (8)"]
            Prompts["Prompts (5)"]
        end

        subgraph DataAccess["Data Access Layer"]
            ProjectRootContext["ProjectRootContextService"]
            ProjectContext["ProjectContextService"]
            ModuleRegistry["ModuleRegistryService"]
            EntityIntrospector["EntityIntrospectorService"]
            CodebaseAnalyzer["CodebaseAnalyzerService"]
            GitContext["GitContextService"]
            GitChangelog["GitChangelogService"]
            DocReader["DocumentationReaderService"]
        end

        subgraph Util["Utilities"]
            FileReader["FileReaderService"]
            PathResolver["PathResolverService"]
        end
    end

    subgraph Target["Target NestJS Project"]
        Src["src/"]
        Docs["docs/"]
        CursorRules[".cursor/rules/"]
        Pkg["package.json"]
        Git["Git repository"]
    end

    Client --> Transport
    Transport --> Feature
    Feature --> DataAccess
    DataAccess --> Util
    DataAccess --> Target
    Util --> Target
    ProjectRootContext --> PathResolver
    ProjectRootContext --> GitContext
```

## 2. Transport Modes

```mermaid
flowchart LR
    subgraph HTTP["Streamable HTTP"]
        A[main.ts] --> B[AppModule]
        B --> C[McpNestjsModule]
        C --> D["/mcp endpoint"]
    end

    subgraph STDIO["STDIO"]
        E[mcp-stdio.entry.ts] --> F[McpStdioAppModule]
        F --> G[stdin/stdout]
    end

    HTTP --> |"npm run start:dev"| H[Port 3100]
    STDIO --> |"npm run start:stdio"| I[No DB/Redis]
```

| Mode | Entry Point | Project Root Source | Use Case |
|------|-------------|--------------------|----------|
| Streamable HTTP | `main.ts` → `AppModule` | `headers["X-Project-Root"]` in mcp.json | Primary mode, full API |
| STDIO | `mcp-stdio.entry.ts` → `McpStdioAppModule` | `env.PROJECT_ROOT` in mcp.json | Lightweight, no database |

**Project root is required.** Configure it in `.cursor/mcp.json` (or equivalent MCP config). Use `${workspaceFolder}` for the current workspace. No fallback — if missing, the MCP returns an error.

## 3. Project Context Detection Flow

```mermaid
flowchart TD
    A[getContext] --> B{Context cached?}
    B -->|Yes| C[Return cached]
    B -->|No| D[detectContext]

    D --> E[detectProjectName]
    D --> F[detectModulePattern]
    D --> G[detectHasDocsDir]
    D --> H[detectDocsLayout]
    D --> I[detectCustomExceptionClass]
    D --> J[detectPathAliases]
    D --> K[detectStack]

    E --> L[package.json]
    F --> M[src/ structure]
    H --> N[docs/CHANGELOG.md<br/>docs/changes/*.md]
    J --> O[tsconfig.json paths]
    K --> P[ORM, validation,<br/>test framework, Redis, BullMQ]

    L --> Q[ProjectContext]
    M --> Q
    N --> Q
    O --> Q
    P --> Q

    Q --> R[Cache & Return]
```

## 4. Project Root Resolution (Config-Driven)

The MCP is **project-agnostic**: the project root is dynamic and comes from the MCP configuration or tool parameters. No fallback — if the path is not provided, the MCP returns an error.

```mermaid
flowchart TD
    A[Request] --> B{projectRoot em tool param?}
    B -->|Sim| C[Usar param]
    B -->|Nao| D{HTTP: header X-Project-Root?}
    D -->|Sim| E[Usar header]
    D -->|Nao| F{STDIO: env PROJECT_ROOT da config?}
    F -->|Sim| G[Usar env do processo]
    F -->|Nao| H[Erro MCP: path obrigatório]
    C --> I[ProjectRootContextService]
    E --> I
    G --> I
```

| Mode | Source in mcp.json | Example |
|------|--------------------|---------|
| **HTTP** | `headers["X-Project-Root"]` | `"X-Project-Root": "${workspaceFolder}"` |
| **STDIO** | `env.PROJECT_ROOT` | `"PROJECT_ROOT": "${workspaceFolder}"` |

Tools accept an optional `projectRoot` parameter to override per request. Resources and prompts use the context set by the middleware (HTTP) or STDIO bootstrap.

## 5. Module Discovery Flow

```mermaid
flowchart TD
    A[listModules] --> B{modulePattern?}
    B -->|nested| C[src/modules/*]
    B -->|domain-driven/flat| D[src/*]

    C --> E[readDir src/modules]
    D --> F[readDir src]

    E --> G[hasModuleFile?]
    F --> G

    G --> H{*.module.ts found?}
    H -->|No| I[Skip]
    H -->|Yes| J[getModuleInfo]

    J --> K[hasController]
    J --> L[entityNames]
    J --> M[hasTests]
    J --> N[hasDocumentation]

    K --> O[ModuleInfo]
    L --> O
    M --> O
    N --> O

    O --> P[Sort by name]
```

## 6. Entity Schema Flow

```mermaid
flowchart TD
    A[getEntitySchema] --> B[readGlob src/**/*.entity.ts]
    B --> C[Find file with entityName]

    C --> D[selectStrategy]
    D --> E{ormOverride?}
    E -->|Yes| F[Use specified strategy]
    E -->|No| G{ProjectContext.orm?}
    G -->|Yes| F
    G -->|No| H[Try each strategy canParse]

    F --> I[MikroORMParserStrategy]
    F --> J[TypeORMParserStrategy]
    F --> K[ObjectionParserStrategy]

    I --> L[parse content]
    J --> L
    K --> L

    L --> M[EntitySchema]
    M --> N[properties, relations, tableName]
```

## 7. Changelog Generation Flow

```mermaid
flowchart TD
    A[ChangelogResource.getChangelog] --> B[GitChangelogService.generateChangelog]
    B --> C[GitContextService.getTags]

    C --> D{Has tags?}
    D -->|No| E[getCommitsBetween undefined, HEAD]
    D -->|Yes| F[getCommitsBetween lastTag, HEAD]

    E --> G[formatCommits]
    F --> G

    G --> H[Match Conventional Commits]
    H --> I[feat → Added]
    H --> J[fix → Fixed]
    H --> K[docs → Documentation]
    H --> L[refactor/style/perf → Changed]
    H --> M[chore/test → Other]

    I --> N[Markdown sections]
    J --> N
    K --> N
    L --> N
    M --> N

    N --> O{Git available?}
    O -->|Yes| P[Return Git changelog]
    O -->|No| Q[DocumentationReaderService.getChangelog]
    Q --> R[Fallback: docs/changes/*.md]
```

## 8. Onboarding Resource Flow

```mermaid
sequenceDiagram
    participant Agent
    participant OnboardingResource
    participant ProjectContext
    participant DocReader
    participant ModuleRegistry

    Agent->>OnboardingResource: GET alaz://onboarding
    OnboardingResource->>ProjectContext: getContext()
    ProjectContext-->>OnboardingResource: ProjectContext

    OnboardingResource->>DocReader: getReadme()
    DocReader-->>OnboardingResource: README content

    OnboardingResource->>DocReader: getApiOverview()
    DocReader-->>OnboardingResource: API overview

    OnboardingResource->>ModuleRegistry: listModules()
    ModuleRegistry-->>OnboardingResource: ModuleInfo[]

    OnboardingResource->>OnboardingResource: Build sections
    OnboardingResource-->>Agent: Markdown onboarding guide
```

## 9. Tools Dependency Graph

```mermaid
flowchart LR
    subgraph Tools
        T1[list-modules]
        T2[get-module-detail]
        T3[get-entity-schema]
        T4[list-endpoints]
        T5[check-conventions]
        T6[get-recent-changes]
        T7[get-test-summary]
    end

    subgraph Services
        MR[ModuleRegistryService]
        EI[EntityIntrospectorService]
        CA[CodebaseAnalyzerService]
        DR[DocumentationReaderService]
        GC[GitContextService]
    end

    T1 --> MR
    T2 --> MR
    T2 --> DR
    T2 --> CA
    T3 --> EI
    T4 --> CA
    T5 --> CA
    T6 --> GC
    T7 --> CA
```

## 10. Resources & Prompts Overview

```mermaid
flowchart TB
    subgraph Static["Static Resources"]
        R1[alaz://onboarding]
        R2[alaz://architecture]
        R3[alaz://conventions/api]
        R4[alaz://conventions/testing]
        R5[alaz://conventions/cqrs]
        R6[alaz://authentication]
        R7[alaz://changelog]
    end

    subgraph Template["Template Resources"]
        R8[alaz://modules/:name]
        R9[alaz://entities/:name]
        R10[alaz://modules/:name/endpoints]
    end

    subgraph Prompts["Prompts (require confirmation)"]
        P1[create-module]
        P2[create-endpoint]
        P3[update-documentation]
        P4[investigate-bug]
    end

    subgraph Checklist["Prompts (no confirmation)"]
        P5[code-review-checklist]
    end
```

## 11. Applications

| Use Case | Tools/Resources | Description |
|----------|-----------------|-------------|
| **Onboarding** | `alaz://onboarding` | Aggregated guide: stack, modules, resources |
| **Module creation** | `create-module` prompt | Template for new NestJS modules |
| **Endpoint creation** | `create-endpoint` prompt | Template for new HTTP endpoints |
| **Documentation** | `update-documentation` prompt, `alaz://modules/{name}` | Guide doc updates |
| **Entity inspection** | `get-entity-schema`, `alaz://entities/{name}` | ORM schema (MikroORM, TypeORM, Objection) |
| **Convention check** | `check-conventions` | Validate project conventions |
| **Recent changes** | `get-recent-changes`, `alaz://changelog` | Commits and versioned changelog |
| **Bug investigation** | `investigate-bug` prompt | Debugging steps |
| **Code review** | `code-review-checklist` prompt | Review criteria |

## 12. File Structure

```mermaid
flowchart TD
    subgraph src["src/mcp/"]
        subgraph data["data-access/"]
            S0[project-root-context.service.ts]
            S1[project-context.service.ts]
            S2[module-registry.service.ts]
            S3[entity-introspector.service.ts]
            S4[codebase-analyzer.service.ts]
            S5[documentation-reader.service.ts]
            S6[git-context.service.ts]
            S7[git-changelog.service.ts]
        end

        subgraph middleware["feature/middleware/"]
            MW1[project-root.middleware.ts]
        end

        subgraph strategies["data-access/strategies/"]
            ST1[mikroorm-parser.strategy.ts]
            ST2[typeorm-parser.strategy.ts]
            ST3[objection-parser.strategy.ts]
        end

        subgraph feature["feature/"]
            T[tools/]
            R[resources/]
            P[prompts/]
        end

        subgraph util["util/"]
            U1[FileReaderService]
            U2[PathResolverService]
        end
    end
```

## 13. Environment Variables & Project Root

### Server environment variables (.env)

| Variable | Required | Description |
|----------|----------|--------------|
| `PORT` | No | HTTP port (default 3100) |
| `NODE_ENV` | No | development/staging/production |

### Project root (MCP config — mcp.json)

The project root is **not** a server env var. It comes from the MCP configuration:

| Mode | Config key | Example |
|------|------------|---------|
| **HTTP** | `headers["X-Project-Root"]` | `"X-Project-Root": "${workspaceFolder}"` |
| **STDIO** | `env.PROJECT_ROOT` | `"PROJECT_ROOT": "${workspaceFolder}"` |

Cursor/VSCode supports `${workspaceFolder}` in `env` and `headers`. If the path is not provided, the MCP returns an error.

## 14. Adding New Tools/Resources/Prompts

```mermaid
flowchart LR
    A[Create class] --> B[Use decorator]
    B --> C["@Tool, @Resource, @Prompt"]
    C --> D[Register in McpNestjsModule]
    D --> E[Register in McpStdioModule]
```

1. Create the class in `src/mcp/feature/tools/`, `resources/` or `prompts/`
2. Use `@Tool`, `@Resource`, `@ResourceTemplate` or `@Prompt` from `@rekog/mcp-nest`
3. Register in `McpNestjsModule` and `McpStdioModule` providers
