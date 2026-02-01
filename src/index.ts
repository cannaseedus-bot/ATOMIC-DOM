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

// Compiler exports
export { CodeGenerator, generate, type CodeGenOptions } from './compiler/codegen.js';

// Validator exports
export {
  validate,
  isValid,
  formatDiagnostics,
  checkLaws,
  validateBlock,
  createSchema,
  createLaw,
  getAvailableLaws,
  BUILTIN_SCHEMAS,
  BUILTIN_LAWS,
  type ValidatorOptions,
  type ValidatorResult,
  type Diagnostic,
  type BlockSchema,
  type PropertySchema,
  type ValidationError,
  type LawViolation,
  type LawResult,
} from './validator/index.js';

// Projection exports
export {
  project,
  DOMRenderer,
  createDOMRenderer,
  renderToString,
  ANSIRenderer,
  createANSIRenderer,
  ANSI,
  SVGRenderer,
  createSVGRenderer,
  createBarChart,
  type ProjectionTarget,
  type ProjectOptions,
  type DOMRendererOptions,
  type RenderResult,
  type ANSIRendererOptions,
  type ANSIStyle,
  type SVGRendererOptions,
} from './projection/index.js';

// TypeScript integration exports
export {
  Atomic,
  Component,
  State,
  Prop,
  Reactive,
  Computed,
  On,
  Watch,
  Child,
  toBlock,
  reactive,
  getBlockMetadata,
  transformToTypeScript,
  generateTypesFromProgram,
  TypeRegistry,
  type BlockMetadata,
  type TransformOptions,
  type TypeGenOptions,
} from './typescript/index.js';

// Splash runtime exports
export {
  createSplashRuntime,
  boot,
  AtomicApp,
  type SplashConfig,
  type SplashRuntime,
} from './splash/index.js';

// CLI exports
export {
  runSetup,
  quickSetup,
  printHelp,
  printVersion,
  printLogo,
  SetupWizard,
  COLORS,
  colorize,
  type AtomicConfig,
  type ProjectionMode,
} from './cli/index.js';

// Re-export parse as parseASXR for convenience
export { parse as parseASXR } from './parser/parser.js';

// Import for compile helper
import { parse as _parse } from './parser/parser.js';
import { generate as _generate } from './compiler/codegen.js';
import type { CodeGenOptions } from './compiler/codegen.js';

/**
 * Compile ASXR source to JavaScript
 */
export function compile(source: string, options?: Partial<CodeGenOptions>): string {
  const ast = _parse(source);
  return _generate(ast, options);
}
