/**
 * ASXR Abstract Syntax Tree Node Definitions
 * Based on ASXR_GRAMMAR_EBNF.md specification
 */

import type { Position } from '../lexer/tokens.js';

/**
 * Base node interface with source location
 */
export interface BaseNode {
  type: string;
  start: Position;
  end: Position;
}

// ============================================================================
// Program & Top-Level
// ============================================================================

export interface Program extends BaseNode {
  type: 'Program';
  body: (Block | Statement | PluginDirective | SectionSeparator | StateProposal)[];
}

export interface SectionSeparator extends BaseNode {
  type: 'SectionSeparator';
  header?: SectionHeader;
}

export interface SectionHeader extends BaseNode {
  type: 'SectionHeader';
  sectionType: string;
  name?: string;
  attributes?: PropertyAssignment[];
}

// ============================================================================
// Blocks
// ============================================================================

export type Block = AtomicBlock | DomBlock | ComponentDef;

export interface AtomicBlock extends BaseNode {
  type: 'AtomicBlock';
  blockType: string;
  id?: string;
  body: BlockBodyItem[];
}

export interface DomBlock extends BaseNode {
  type: 'DomBlock';
  selector: string;
  id?: string;
  body: BlockBodyItem[];
}

export interface ComponentDef extends BaseNode {
  type: 'ComponentDef';
  name: string;
  body: BlockBodyItem[];
}

export type BlockBodyItem =
  | PropertyAssignment
  | Statement
  | Expression
  | Block;

// ============================================================================
// Properties & Values
// ============================================================================

export interface PropertyAssignment extends BaseNode {
  type: 'PropertyAssignment';
  name: string;
  isAtProperty: boolean;
  value: Expression;
}

export type Expression =
  | Literal
  | Reference
  | BlockReference
  | Identifier
  | BinaryExpression
  | UnaryExpression
  | CallExpression
  | MemberExpression
  | ArrayExpression
  | ObjectExpression
  | LambdaExpression;

export interface Literal extends BaseNode {
  type: 'Literal';
  value: string | number | boolean | null;
  raw: string;
}

export interface Reference extends BaseNode {
  type: 'Reference';
  path: string;
}

export interface BlockReference extends BaseNode {
  type: 'BlockReference';
  name: string;
}

export interface Identifier extends BaseNode {
  type: 'Identifier';
  name: string;
}

export interface BinaryExpression extends BaseNode {
  type: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface UnaryExpression extends BaseNode {
  type: 'UnaryExpression';
  operator: string;
  argument: Expression;
}

export interface CallExpression extends BaseNode {
  type: 'CallExpression';
  callee: Expression;
  arguments: Expression[];
}

export interface MemberExpression extends BaseNode {
  type: 'MemberExpression';
  object: Expression;
  property: Expression;
  computed: boolean;
}

export interface ArrayExpression extends BaseNode {
  type: 'ArrayExpression';
  elements: Expression[];
}

export interface ObjectExpression extends BaseNode {
  type: 'ObjectExpression';
  properties: PropertyAssignment[];
}

export interface LambdaExpression extends BaseNode {
  type: 'LambdaExpression';
  params: Identifier[];
  body: BlockBodyItem[];
}

// ============================================================================
// Statements
// ============================================================================

export type Statement =
  | AssignmentStatement
  | IfStatement
  | ForStatement
  | WhileStatement
  | DoWhileStatement
  | SwitchStatement
  | ServerCall
  | BinaryTrigger
  | ReactorBlock;

export interface AssignmentStatement extends BaseNode {
  type: 'AssignmentStatement';
  target: string;
  value: Expression;
}

export interface IfStatement extends BaseNode {
  type: 'IfStatement';
  condition: Expression;
  consequent: BlockBodyItem[];
  alternate?: BlockBodyItem[] | IfStatement;
}

export interface ForStatement extends BaseNode {
  type: 'ForStatement';
  iterator?: string;
  iterable?: Expression;
  init?: Expression;
  test?: Expression;
  update?: Expression;
  body: BlockBodyItem[];
}

export interface WhileStatement extends BaseNode {
  type: 'WhileStatement';
  condition: Expression;
  body: BlockBodyItem[];
}

export interface DoWhileStatement extends BaseNode {
  type: 'DoWhileStatement';
  body: BlockBodyItem[];
  condition: Expression;
}

export interface SwitchStatement extends BaseNode {
  type: 'SwitchStatement';
  discriminant: Expression;
  cases: SwitchCase[];
}

export interface SwitchCase extends BaseNode {
  type: 'SwitchCase';
  test: Expression | null; // null for default case
  consequent: BlockBodyItem[];
}

// ============================================================================
// Server Calls & Triggers
// ============================================================================

export interface ServerCall extends BaseNode {
  type: 'ServerCall';
  target: string | Expression;
  modifiers: string[];
  arguments: NamedArgument[];
  returnHandler?: Expression;
}

export interface NamedArgument extends BaseNode {
  type: 'NamedArgument';
  name: string;
  value: Expression;
}

export interface BinaryTrigger extends BaseNode {
  type: 'BinaryTrigger';
  source: string;
  filter?: string;
  body: (BinaryPattern | ServerCall | Statement)[];
}

export interface BinaryPattern extends BaseNode {
  type: 'BinaryPattern';
  match: Expression;
  action: ServerCall;
}

export interface ReactorBlock extends BaseNode {
  type: 'ReactorBlock';
  name: string;
  body: (BinaryTrigger | TimerBlock | Statement)[];
}

export interface TimerBlock extends BaseNode {
  type: 'TimerBlock';
  interval: string;
  body: BlockBodyItem[];
}

// ============================================================================
// State & Proposals
// ============================================================================

export interface StateProposal extends BaseNode {
  type: 'StateProposal';
  prior: Expression;
  next: StateDefinition;
  constraints: Constraint[];
}

export interface StateDefinition extends BaseNode {
  type: 'StateDefinition';
  blocks: Block[];
  phase: string;
  epoch: number;
}

export interface Constraint extends BaseNode {
  type: 'Constraint';
  name: string;
  arguments?: Expression[];
}

export interface DomProposal extends BaseNode {
  type: 'DomProposal';
  prior: Expression;
  next: Expression;
  patch: PatchOperation[];
}

export interface PatchOperation extends BaseNode {
  type: 'PatchOperation';
  operation: 'CREATE' | 'DELETE' | 'UPDATE' | 'MOVE';
  target: string;
  data?: Expression;
}

// ============================================================================
// Plugin System
// ============================================================================

export interface PluginDirective extends BaseNode {
  type: 'PluginDirective';
  name: string;
  source?: string;
  config?: ObjectExpression;
}

export interface PluginDeclaration extends BaseNode {
  type: 'PluginDeclaration';
  name: string;
  version: string;
  syntax: SyntaxRule[];
  handlers: BlockReference[];
  conflicts?: string[];
}

export interface SyntaxRule extends BaseNode {
  type: 'SyntaxRule';
  pattern: string;
  astNode: string;
  priority: number;
}

export interface PluginSection extends BaseNode {
  type: 'PluginSection';
  plugins: PluginLoad[];
}

export interface PluginLoad extends BaseNode {
  type: 'PluginLoad';
  name: string;
  alias?: string;
  version?: string;
}

export interface ConflictResolution extends BaseNode {
  type: 'ConflictResolution';
  rules: ConflictRule[];
}

export interface ConflictRule extends BaseNode {
  type: 'ConflictRule';
  plugins: [string, string];
  resolution: 'prefer' | 'merge' | 'error';
  preference?: string;
}

export interface TransformDirective extends BaseNode {
  type: 'TransformDirective';
  plugin: string;
  input: BlockReference;
  outputs: OutputSpec[];
}

export interface OutputSpec extends BaseNode {
  type: 'OutputSpec';
  language: 'js' | 'wasm' | 'dom' | 'ir';
  format: 'esm' | 'cjs' | 'iife';
  optimize?: boolean;
}

// ============================================================================
// Type Definitions
// ============================================================================

export type ASTNode =
  | Program
  | SectionSeparator
  | SectionHeader
  | Block
  | PropertyAssignment
  | Expression
  | Statement
  | StateProposal
  | StateDefinition
  | Constraint
  | DomProposal
  | PatchOperation
  | PluginDirective
  | PluginDeclaration
  | SyntaxRule
  | PluginSection
  | PluginLoad
  | ConflictResolution
  | ConflictRule
  | TransformDirective
  | OutputSpec
  | NamedArgument
  | BinaryPattern
  | TimerBlock
  | SwitchCase;

// ============================================================================
// AST Visitor Interface
// ============================================================================

export interface ASTVisitor<T = void> {
  visitProgram?(node: Program): T;
  visitAtomicBlock?(node: AtomicBlock): T;
  visitDomBlock?(node: DomBlock): T;
  visitComponentDef?(node: ComponentDef): T;
  visitPropertyAssignment?(node: PropertyAssignment): T;
  visitLiteral?(node: Literal): T;
  visitReference?(node: Reference): T;
  visitBlockReference?(node: BlockReference): T;
  visitIdentifier?(node: Identifier): T;
  visitBinaryExpression?(node: BinaryExpression): T;
  visitUnaryExpression?(node: UnaryExpression): T;
  visitCallExpression?(node: CallExpression): T;
  visitMemberExpression?(node: MemberExpression): T;
  visitArrayExpression?(node: ArrayExpression): T;
  visitObjectExpression?(node: ObjectExpression): T;
  visitLambdaExpression?(node: LambdaExpression): T;
  visitIfStatement?(node: IfStatement): T;
  visitForStatement?(node: ForStatement): T;
  visitWhileStatement?(node: WhileStatement): T;
  visitServerCall?(node: ServerCall): T;
  visitStateProposal?(node: StateProposal): T;
  visitPluginDirective?(node: PluginDirective): T;
}

/**
 * Walk the AST and call visitor methods
 */
export function walkAST(node: ASTNode, visitor: ASTVisitor): void {
  const methodName = `visit${node.type}` as keyof ASTVisitor;
  const method = visitor[methodName];
  if (typeof method === 'function') {
    (method as (n: ASTNode) => void).call(visitor, node);
  }

  // Recursively visit children based on node type
  if ('body' in node && Array.isArray(node.body)) {
    for (const child of node.body) {
      walkAST(child as ASTNode, visitor);
    }
  }
  if ('value' in node && typeof node.value === 'object' && node.value !== null) {
    walkAST(node.value as ASTNode, visitor);
  }
}
