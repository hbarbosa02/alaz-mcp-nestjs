import type { EntityParserStrategy } from '@mcp/domain/nestjs/data-access/strategies/entity-parser.strategy';

export const ENTITY_PARSER_STRATEGIES = Symbol('ENTITY_PARSER_STRATEGIES');

export type EntityParserStrategies = EntityParserStrategy[];
