# MCP Framework Port Interfaces

Este documento descreve os contratos de interface (ports) que cada domínio de framework deve implementar para integrar-se ao MCP. Os adapters NestJS já implementam essas interfaces; Angular e Laravel estão planejados.

## Portas Principais

### IModuleRegistry

Lista e obtém informações sobre módulos do projeto.

```typescript
interface IModuleRegistry {
  listModules(): Promise<ModuleInfo[]>;
  getModule(name: string): Promise<ModuleInfo | null>;
}
```

| Framework | Equivalente | Status |
|-----------|-------------|--------|
| NestJS | `*.module.ts` em `src/` | Implementado |
| Angular | `*.module.ts` em `src/app/` | Em breve |
| Laravel | Módulos/namespaces em `app/` | Em breve |

### IEntityIntrospector

Inspeciona entidades/modelos do projeto (ORM, schema).

```typescript
interface IEntityIntrospector {
  listEntities(ormOverride?: OrmType): Promise<EntitySchema[]>;
  getEntitySchema(entityName: string, ormOverride?: OrmType): Promise<EntitySchema | null>;
}
```

| Framework | Equivalente | Status |
|-----------|-------------|--------|
| NestJS | MikroORM, TypeORM, Objection entities | Implementado |
| Angular | N/A (frontend) — possivelmente services/state | Em breve |
| Laravel | Eloquent Models | Em breve |

### ICodebaseAnalyzer

Analisa endpoints/rotas da API.

```typescript
interface ICodebaseAnalyzer {
  getEndpoints(moduleName?: string): Promise<EndpointInfo[]>;
  getModuleEndpoints(moduleName: string): Promise<EndpointInfo[]>;
}
```

| Framework | Equivalente | Status |
|-----------|-------------|--------|
| NestJS | Controllers com `@Get`, `@Post`, etc. | Implementado |
| Angular | N/A (frontend) | Em breve |
| Laravel | Controllers, rotas em `routes/` | Em breve |

### IDocumentationReader

Lê documentação do projeto.

```typescript
interface IDocumentationReader {
  getFeatureDoc(moduleName: string): Promise<string | null>;
  getArchitectureDocs(): Promise<Record<string, string>>;
  getApiConventions(): Promise<string | null>;
  getReadme(): Promise<string | null>;
}
```

### IProjectContext

Fornece contexto do projeto (padrões, stack, layout de docs).

```typescript
interface IProjectContext {
  getContext(): Promise<ProjectContext>;
}
```

## Tipos Compartilhados

Definidos em `src/mcp/core/ports/types.ts`:

- `ModuleInfo` — nome, path, hasController, entityNames, etc.
- `EntitySchema` — name, tableName, properties, relations
- `EndpointInfo` — method, path, controllerClass, permissions, authType

## FrameworkAdapterRegistry

O `FrameworkAdapterRegistryService` (em `nestjs/data-access/services/`) retorna o adapter correto conforme o framework detectado:

- `nestjs` → adapters NestJS (implementados)
- `angular` → `null` (mensagem "Em breve")
- `laravel` → `null` (mensagem "Em breve")
- `null` → mensagem "Framework não suportado"

## Equivalentes por Framework

As interfaces atuais são orientadas a NestJS. Outros frameworks podem expor equivalentes conceituais:

| Porta NestJS        | Equivalente Angular        | Equivalente Laravel        |
|---------------------|----------------------------|----------------------------|
| `IModuleRegistry`   | `IComponentRegistry`       | `IModuleRegistry` (namespaces) |
| `IEntityIntrospector` | N/A (frontend) ou services/state | `IModelRegistry` (Eloquent) |
| `ICodebaseAnalyzer` | N/A (frontend) ou rotas de serviços | `IRouteAnalyzer` (routes/) |
| `IDocumentationReader` | Sim (docs do projeto)     | Sim (docs do projeto)      |
| `IProjectContext`   | Sim (angular.json, tsconfig) | Sim (composer.json, config/) |

**Nota:** Angular pode priorizar `IComponentRegistry` para componentes e NgModules. Laravel pode priorizar `IModelRegistry` para Eloquent Models e `IRouteAnalyzer` para rotas em `routes/`. A decisão de mapear para as portas existentes ou criar novas fica para a implementação futura.

## Implementação Futura

Para adicionar suporte a Angular ou Laravel:

1. Implementar as interfaces em `mcp/domain/angular/` ou `mcp/domain/laravel/`
2. Registrar os adapters no `FrameworkAdapterRegistryService`
3. Atualizar `FrameworkDetectorService` se necessário (composer.json para Laravel)
4. Adicionar `AngularDomainModule` ou `LaravelDomainModule` aos imports do `McpModule`

---

## Considerações Futuras (Phase 4)

### Detecção multi-manifest (Laravel e composer.json)

O `FrameworkDetectorService` já suporta detecção multi-manifest:

- **package.json**: NestJS (`@nestjs/core`), Angular (`@angular/core`)
- **composer.json**: Laravel (`laravel/framework` em `require` ou `require-dev`)

A ordem de verificação: primeiro `package.json`, depois `composer.json`. Projetos PHP puros (Laravel) não têm `package.json` com dependências de framework; projetos Node podem ter ambos (ex.: Laravel + Vite).

Contrato de detecção:

1. Ler `package.json` → se `@nestjs/core` ou `@angular/core` → retornar framework
2. Ler `composer.json` → se `laravel/framework` → retornar `laravel`
3. Caso contrário → retornar `null`

### Estratégia de recursos estáticos (alaz://)

Recursos estáticos como `alaz://conventions/api`, `alaz://authentication`, `alaz://architecture`:

- **Opção A**: Manter como templates NestJS até haver equivalentes por framework
- **Opção B**: Criar variantes por framework (`alaz://conventions/nestjs`, `alaz://conventions/laravel`, etc.)
- **Opção C**: Recursos genéricos que delegam ao adapter do framework (ex.: `alaz://conventions` → adapter retorna conteúdo conforme framework)

Recomendação: Opção C — um único URI que delega ao adapter. Se o framework não tiver implementação, retornar mensagem "Em breve" ou conteúdo genérico.

### Equivalentes de prompts por framework

| NestJS (atual) | Angular (futuro) | Laravel (futuro) |
|----------------|------------------|-------------------|
| `create-module` | `create-component` | `create-module` ou `make:module` |
| `create-endpoint` | N/A (frontend) | `create-controller` / `make:controller` |
| `update-documentation` | `update-documentation` | `update-documentation` |
| `code-review` | `code-review` | `code-review` |
| `investigate-bug` | `investigate-bug` | `investigate-bug` |

Criar seção "Future framework prompts" em docs ao implementar Angular/Laravel. Os prompts NestJS-specific (`create-module`, `create-endpoint`) terão equivalentes conceituais em cada ecossistema.
