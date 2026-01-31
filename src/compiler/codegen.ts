/**
 * ASXR Code Generator
 * Transforms AST to JavaScript code
 */

import type {
  Program,
  Block,
  AtomicBlock,
  DomBlock,
  ComponentDef,
  BlockBodyItem,
  PropertyAssignment,
  Expression,
  Literal,
  Reference,
  BlockReference,
  Identifier,
  BinaryExpression,
  UnaryExpression,
  ArrayExpression,
  ObjectExpression,
  LambdaExpression,
  Statement,
  IfStatement,
  ForStatement,
  WhileStatement,
  ServerCall,
  StateProposal,
  PluginDirective,
  ReactorBlock,
  BinaryTrigger,
  TimerBlock,
} from '../parser/ast.js';

export interface CodeGenOptions {
  /** Output format: ESM or CommonJS */
  format: 'esm' | 'cjs';
  /** Minify output */
  minify?: boolean;
  /** Include source maps */
  sourceMaps?: boolean;
  /** Runtime import path */
  runtimePath?: string;
}

const DEFAULT_OPTIONS: CodeGenOptions = {
  format: 'esm',
  minify: false,
  sourceMaps: false,
  runtimePath: 'atomic-dom/runtime',
};

export class CodeGenerator {
  private options: CodeGenOptions;
  private indent: number = 0;
  private output: string[] = [];
  private blockRegistry: Map<string, string> = new Map();

  constructor(options: Partial<CodeGenOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Generate JavaScript code from AST
   */
  generate(program: Program): string {
    this.output = [];
    this.indent = 0;
    this.blockRegistry.clear();

    // Add runtime import
    this.emitRuntimeImport();
    this.emit('');

    // Process all top-level items
    for (const item of program.body) {
      this.generateTopLevel(item);
      this.emit('');
    }

    // Export block registry
    this.emitBlockExports();

    return this.output.join('\n');
  }

  private emitRuntimeImport(): void {
    const path = this.options.runtimePath;
    if (this.options.format === 'esm') {
      this.emit(`import { createBlock, createDom, propose, call, reactor } from '${path}';`);
    } else {
      this.emit(`const { createBlock, createDom, propose, call, reactor } = require('${path}');`);
    }
  }

  private emitBlockExports(): void {
    if (this.blockRegistry.size === 0) return;

    this.emit('// Block exports');
    if (this.options.format === 'esm') {
      this.emit(`export const blocks = {`);
    } else {
      this.emit(`module.exports.blocks = {`);
    }
    this.indent++;

    for (const [id, varName] of this.blockRegistry) {
      this.emit(`'${id}': ${varName},`);
    }

    this.indent--;
    this.emit('};');
  }

  private generateTopLevel(
    item: Block | Statement | PluginDirective | StateProposal | { type: string }
  ): void {
    switch (item.type) {
      case 'AtomicBlock':
        this.generateAtomicBlock(item as AtomicBlock);
        break;
      case 'DomBlock':
        this.generateDomBlock(item as DomBlock);
        break;
      case 'ComponentDef':
        this.generateComponentDef(item as ComponentDef);
        break;
      case 'StateProposal':
        this.generateStateProposal(item as StateProposal);
        break;
      case 'PluginDirective':
        this.generatePluginDirective(item as PluginDirective);
        break;
      case 'IfStatement':
        this.generateIfStatement(item as IfStatement);
        break;
      case 'ForStatement':
        this.generateForStatement(item as ForStatement);
        break;
      case 'WhileStatement':
        this.generateWhileStatement(item as WhileStatement);
        break;
      case 'ServerCall':
        this.generateServerCall(item as ServerCall);
        break;
      case 'ReactorBlock':
        this.generateReactorBlock(item as ReactorBlock);
        break;
      case 'SectionSeparator':
        this.emit('// ---');
        break;
      default:
        this.emit(`// Unknown: ${item.type}`);
    }
  }

  // ==========================================================================
  // Block Generation
  // ==========================================================================

  private generateAtomicBlock(block: AtomicBlock): void {
    const varName = this.toVarName(block.id || block.blockType);
    if (block.id) {
      this.blockRegistry.set(block.id, varName);
    }

    this.emit(`const ${varName} = createBlock('${block.blockType}', ${block.id ? `'${block.id}'` : 'null'}, {`);
    this.indent++;

    for (const item of block.body) {
      this.generateBlockBodyItem(item);
    }

    this.indent--;
    this.emit('});');
  }

  private generateDomBlock(block: DomBlock): void {
    const varName = this.toVarName(block.id || block.selector);
    if (block.id) {
      this.blockRegistry.set(block.id, varName);
    }

    this.emit(`const ${varName} = createDom('${block.selector}', ${block.id ? `'${block.id}'` : 'null'}, {`);
    this.indent++;

    for (const item of block.body) {
      this.generateBlockBodyItem(item);
    }

    this.indent--;
    this.emit('});');
  }

  private generateComponentDef(component: ComponentDef): void {
    const varName = this.toVarName(component.name);
    this.blockRegistry.set(component.name, varName);

    this.emit(`const ${varName} = createBlock('component', '${component.name}', {`);
    this.indent++;

    for (const item of component.body) {
      this.generateBlockBodyItem(item);
    }

    this.indent--;
    this.emit('});');
  }

  private generateBlockBodyItem(item: BlockBodyItem): void {
    switch (item.type) {
      case 'PropertyAssignment':
        this.generatePropertyAssignment(item as PropertyAssignment);
        break;
      case 'AtomicBlock':
        // Nested block - inline it
        this.emit(`// nested @${(item as AtomicBlock).blockType}`);
        this.generateAtomicBlock(item as AtomicBlock);
        break;
      case 'DomBlock':
        this.generateDomBlock(item as DomBlock);
        break;
      case 'IfStatement':
        this.generateIfStatement(item as IfStatement);
        break;
      case 'ForStatement':
        this.generateForStatement(item as ForStatement);
        break;
      default:
        this.emit(`// ${item.type}`);
    }
  }

  private generatePropertyAssignment(prop: PropertyAssignment): void {
    const name = prop.isAtProperty ? `'@${prop.name}'` : prop.name;
    const value = this.generateExpression(prop.value);
    this.emit(`${name}: ${value},`);
  }

  // ==========================================================================
  // Expression Generation
  // ==========================================================================

  private generateExpression(expr: Expression): string {
    switch (expr.type) {
      case 'Literal':
        return this.generateLiteral(expr as Literal);
      case 'Reference':
        return this.generateReference(expr as Reference);
      case 'BlockReference':
        return this.generateBlockReference(expr as BlockReference);
      case 'Identifier':
        return (expr as Identifier).name;
      case 'BinaryExpression':
        return this.generateBinaryExpression(expr as BinaryExpression);
      case 'UnaryExpression':
        return this.generateUnaryExpression(expr as UnaryExpression);
      case 'ArrayExpression':
        return this.generateArrayExpression(expr as ArrayExpression);
      case 'ObjectExpression':
        return this.generateObjectExpression(expr as ObjectExpression);
      case 'LambdaExpression':
        return this.generateLambdaExpression(expr as LambdaExpression);
      default:
        return `/* unknown: ${expr.type} */`;
    }
  }

  private generateLiteral(lit: Literal): string {
    if (typeof lit.value === 'string') {
      return JSON.stringify(lit.value);
    }
    if (lit.value === null) {
      return 'null';
    }
    return String(lit.value);
  }

  private generateReference(ref: Reference): string {
    // {{path.to.value}} becomes a getter function
    return `() => state.get('${ref.path}')`;
  }

  private generateBlockReference(ref: BlockReference): string {
    // #blockName becomes a block lookup
    return `blocks['${ref.name}']`;
  }

  private generateBinaryExpression(expr: BinaryExpression): string {
    const left = this.generateExpression(expr.left);
    const right = this.generateExpression(expr.right);
    return `(${left} ${expr.operator} ${right})`;
  }

  private generateUnaryExpression(expr: UnaryExpression): string {
    const arg = this.generateExpression(expr.argument);
    return `(${expr.operator}${arg})`;
  }

  private generateArrayExpression(expr: ArrayExpression): string {
    const elements = expr.elements.map((e) => this.generateExpression(e));
    return `[${elements.join(', ')}]`;
  }

  private generateObjectExpression(expr: ObjectExpression): string {
    const props = expr.properties.map((p) => {
      const value = this.generateExpression(p.value);
      return `${p.name}: ${value}`;
    });
    return `{ ${props.join(', ')} }`;
  }

  private generateLambdaExpression(expr: LambdaExpression): string {
    const params = expr.params.map((p) => p.name).join(', ');
    // For now, simple single-expression lambdas
    if (expr.body.length === 1 && expr.body[0].type === 'PropertyAssignment') {
      const prop = expr.body[0] as PropertyAssignment;
      if (prop.name === '_return') {
        const value = this.generateExpression(prop.value);
        return `(${params}) => ${value}`;
      }
    }
    // Multi-statement lambda
    const body = expr.body
      .map((item) => {
        if (item.type === 'PropertyAssignment') {
          const prop = item as PropertyAssignment;
          return `  const ${prop.name} = ${this.generateExpression(prop.value)};`;
        }
        return '  // statement';
      })
      .join('\n');
    return `(${params}) => {\n${body}\n}`;
  }

  // ==========================================================================
  // Statement Generation
  // ==========================================================================

  private generateIfStatement(stmt: IfStatement): void {
    const condition = this.generateExpression(stmt.condition);
    this.emit(`if (${condition}) {`);
    this.indent++;

    for (const item of stmt.consequent) {
      this.generateBlockBodyItem(item);
    }

    this.indent--;

    if (stmt.alternate) {
      if (Array.isArray(stmt.alternate)) {
        this.emit('} else {');
        this.indent++;
        for (const item of stmt.alternate) {
          this.generateBlockBodyItem(item);
        }
        this.indent--;
      } else {
        this.emit('} else');
        this.generateIfStatement(stmt.alternate);
        return;
      }
    }

    this.emit('}');
  }

  private generateForStatement(stmt: ForStatement): void {
    if (stmt.iterator && stmt.iterable) {
      const iterable = this.generateExpression(stmt.iterable);
      this.emit(`for (const ${stmt.iterator} of ${iterable}) {`);
    } else {
      const init = stmt.init ? this.generateExpression(stmt.init) : '';
      const test = stmt.test ? this.generateExpression(stmt.test) : '';
      const update = stmt.update ? this.generateExpression(stmt.update) : '';
      this.emit(`for (${init}; ${test}; ${update}) {`);
    }

    this.indent++;
    for (const item of stmt.body) {
      this.generateBlockBodyItem(item);
    }
    this.indent--;
    this.emit('}');
  }

  private generateWhileStatement(stmt: WhileStatement): void {
    const condition = this.generateExpression(stmt.condition);
    this.emit(`while (${condition}) {`);
    this.indent++;

    for (const item of stmt.body) {
      this.generateBlockBodyItem(item);
    }

    this.indent--;
    this.emit('}');
  }

  private generateServerCall(call: ServerCall): void {
    const target =
      typeof call.target === 'string' ? `'${call.target}'` : this.generateExpression(call.target);

    const modifiers = call.modifiers.length > 0 ? `[${call.modifiers.map((m) => `'${m}'`).join(', ')}]` : '[]';

    const args = call.arguments
      .map((arg) => `${arg.name}: ${this.generateExpression(arg.value)}`)
      .join(', ');

    let callExpr = `call(${target}, ${modifiers}, { ${args} })`;

    if (call.returnHandler) {
      const handler = this.generateExpression(call.returnHandler);
      callExpr += `.then(${handler})`;
    }

    this.emit(`${callExpr};`);
  }

  private generateStateProposal(proposal: StateProposal): void {
    const prior = this.generateExpression(proposal.prior);

    this.emit(`propose({`);
    this.indent++;
    this.emit(`prior: ${prior},`);
    this.emit(`next: {`);
    this.indent++;
    this.emit(`phase: '${proposal.next.phase}',`);
    this.emit(`epoch: ${proposal.next.epoch},`);
    this.emit(`blocks: [`);
    this.indent++;

    for (const block of proposal.next.blocks) {
      if (block.type === 'AtomicBlock') {
        const ab = block as AtomicBlock;
        this.emit(`{ type: '${ab.blockType}', id: ${ab.id ? `'${ab.id}'` : 'null'} },`);
      }
    }

    this.indent--;
    this.emit(`],`);
    this.indent--;
    this.emit(`},`);

    if (proposal.constraints.length > 0) {
      const constraints = proposal.constraints.map((c) => `'${c.name}'`).join(', ');
      this.emit(`constraints: [${constraints}],`);
    }

    this.indent--;
    this.emit(`});`);
  }

  private generatePluginDirective(directive: PluginDirective): void {
    const source = directive.source ? `, '${directive.source}'` : '';
    this.emit(`// @use plugin "${directive.name}"${source}`);
    // Plugin loading is handled at compile time, not runtime
  }

  private generateReactorBlock(reactor: ReactorBlock): void {
    this.emit(`const ${this.toVarName(reactor.name)} = reactor('${reactor.name}', {`);
    this.indent++;

    for (const item of reactor.body) {
      if (item.type === 'BinaryTrigger') {
        this.generateBinaryTrigger(item as BinaryTrigger);
      } else if (item.type === 'TimerBlock') {
        this.generateTimerBlock(item as TimerBlock);
      }
    }

    this.indent--;
    this.emit('});');
  }

  private generateBinaryTrigger(trigger: BinaryTrigger): void {
    this.emit(`on('${trigger.source}'${trigger.filter ? `, '${trigger.filter}'` : ''}, async (data) => {`);
    this.indent++;

    for (const item of trigger.body) {
      if (item.type === 'ServerCall') {
        this.generateServerCall(item as ServerCall);
      }
    }

    this.indent--;
    this.emit('}),');
  }

  private generateTimerBlock(timer: TimerBlock): void {
    this.emit(`every('${timer.interval}', async () => {`);
    this.indent++;

    for (const item of timer.body) {
      this.generateBlockBodyItem(item);
    }

    this.indent--;
    this.emit('}),');
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  private emit(line: string): void {
    const indentStr = '  '.repeat(this.indent);
    this.output.push(indentStr + line);
  }

  private toVarName(name: string | undefined): string {
    if (!name) return '_anonymous';
    // Convert to valid JS identifier
    return name
      .replace(/^#/, '')
      .replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      .replace(/[^a-zA-Z0-9_]/g, '_');
  }
}

/**
 * Generate JavaScript code from ASXR AST
 */
export function generate(program: Program, options?: Partial<CodeGenOptions>): string {
  const generator = new CodeGenerator(options);
  return generator.generate(program);
}
