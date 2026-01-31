/**
 * ASXR Token Types
 * Based on ASXR_GRAMMAR_EBNF.md specification
 */

export enum TokenType {
  // Literals
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  NULL = 'NULL',

  // Identifiers
  IDENTIFIER = 'IDENTIFIER',
  AT_IDENTIFIER = 'AT_IDENTIFIER', // @identifier

  // References
  REFERENCE = 'REFERENCE', // {{path.expression}}
  BLOCK_REF = 'BLOCK_REF', // #identifier

  // Delimiters
  LBRACE = 'LBRACE', // {
  RBRACE = 'RBRACE', // }
  LBRACKET = 'LBRACKET', // [
  RBRACKET = 'RBRACKET', // ]
  LPAREN = 'LPAREN', // (
  RPAREN = 'RPAREN', // )
  SEMICOLON = 'SEMICOLON', // ;
  COLON = 'COLON', // :
  COMMA = 'COMMA', // ,
  DOT = 'DOT', // .
  SLASH = 'SLASH', // /

  // Operators
  EQUALS = 'EQUALS', // =
  ARROW = 'ARROW', // ->
  FAT_ARROW = 'FAT_ARROW', // =>
  PLUS = 'PLUS', // +
  MINUS = 'MINUS', // -
  STAR = 'STAR', // *
  PERCENT = 'PERCENT', // %
  LT = 'LT', // <
  GT = 'GT', // >
  LTE = 'LTE', // <=
  GTE = 'GTE', // >=
  EQ = 'EQ', // ==
  NEQ = 'NEQ', // !=
  STRICT_EQ = 'STRICT_EQ', // ===
  STRICT_NEQ = 'STRICT_NEQ', // !==
  AND = 'AND', // &&
  OR = 'OR', // ||
  NOT = 'NOT', // !

  // Section separator
  SECTION_SEP = 'SECTION_SEP', // ---

  // Special
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
  COMMENT = 'COMMENT',

  // Error
  ERROR = 'ERROR',
}

/**
 * Reserved @ keywords in ASXR
 */
export const AT_KEYWORDS = new Set([
  'atomic',
  'block',
  'dom',
  'propose',
  'propose_dom',
  'if',
  'else',
  'for',
  'while',
  'do',
  'switch',
  'case',
  'default',
  'set',
  'call',
  'use',
  'plugin',
  'plugins',
  'resolve',
  'transform',
  'on',
  'component',
  'type',
  'schema',
  'state',
  'protocol',
  'projection',
  'config',
  'tokenizer',
  'reactor',
  'every',
  'call-pool',
  'protocol-bridge',
  'websocket-router',
  'event-bus',
  'state-machine',
  'route',
  'subscribe',
  'middleware',
  'message',
  'ack',
  'mime',
  'classes',
  'pipe',
  'compile',
  'control-plane',
  'control-scan',
  'operator',
]);

/**
 * Token position in source
 */
export interface Position {
  line: number;
  column: number;
  offset: number;
}

/**
 * Token with position and value
 */
export interface Token {
  type: TokenType;
  value: string;
  start: Position;
  end: Position;
}

/**
 * Create a token
 */
export function createToken(
  type: TokenType,
  value: string,
  start: Position,
  end: Position
): Token {
  return { type, value, start, end };
}
