import type { EntityParserStrategy } from './entity-parser.strategy';

export const ENTITY_PARSER_STRATEGIES = Symbol('ENTITY_PARSER_STRATEGIES');

export type EntityParserStrategies = EntityParserStrategy[];
