/**
 * ATOMIC-DOM: ASXR Language Parser and Compiler
 *
 * @module atomic-dom
 */

// Lexer exports
export { Lexer, tokenize } from './lexer/lexer.js';
export { Token, TokenType, Position, createToken, AT_KEYWORDS } from './lexer/tokens.js';

// Parser exports
export { Parser, ParseError, parse } from './parser/parser.js';

// AST exports
export type {
  // Base
  BaseNode,
  ASTNode,
  ASTVisitor,

  // Program
  Program,
  SectionSeparator,
  SectionHeader,

  // Blocks
  Block,
  AtomicBlock,
  DomBlock,
  ComponentDef,
  BlockBodyItem,

  // Properties & Values
  PropertyAssignment,
  Expression,
  Literal,
  Reference,
  BlockReference,
  Identifier,
  BinaryExpression,
  UnaryExpression,
  CallExpression,
  MemberExpression,
  ArrayExpression,
  ObjectExpression,
  LambdaExpression,

  // Statements
  Statement,
  AssignmentStatement,
  IfStatement,
  ForStatement,
  WhileStatement,
  DoWhileStatement,
  SwitchStatement,
  SwitchCase,
  ServerCall,
  NamedArgument,
  BinaryTrigger,
  BinaryPattern,
  ReactorBlock,
  TimerBlock,

  // State
  StateProposal,
  StateDefinition,
  Constraint,
  DomProposal,
  PatchOperation,

  // Plugins
  PluginDirective,
  PluginDeclaration,
  SyntaxRule,
  PluginSection,
  PluginLoad,
  ConflictResolution,
  ConflictRule,
  TransformDirective,
  OutputSpec,
} from './parser/ast.js';

export { walkAST } from './parser/ast.js';

// Re-export parse as parseASXR for convenience
export { parse as parseASXR } from './parser/parser.js';
