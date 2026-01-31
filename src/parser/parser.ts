/**
 * ASXR Recursive Descent Parser
 * Parses ASXR tokens into an AST according to the grammar specification
 */

import { Token, TokenType, Position } from '../lexer/tokens.js';
import { tokenize } from '../lexer/lexer.js';
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
  ReactorBlock,
  TimerBlock,
  StateProposal,
  StateDefinition,
  Constraint,
  PluginDirective,
  SectionSeparator,
} from './ast.js';

export class ParseError extends Error {
  constructor(
    message: string,
    public position: Position,
    public token?: Token
  ) {
    super(`${message} at line ${position.line}, column ${position.column}`);
    this.name = 'ParseError';
  }
}

export class Parser {
  private tokens: Token[] = [];
  private pos: number = 0;
  private errors: ParseError[] = [];

  constructor(private source: string) {}

  /**
   * Parse source code into AST
   */
  parse(): Program {
    this.tokens = tokenize(this.source);
    this.pos = 0;
    this.errors = [];

    const body: (Block | Statement | PluginDirective | SectionSeparator | StateProposal)[] = [];
    const start = this.position();

    while (!this.isAtEnd()) {
      this.skipNewlines();
      if (this.isAtEnd()) break;

      try {
        const item = this.parseTopLevel();
        if (item) {
          body.push(item);
        }
      } catch (error) {
        if (error instanceof ParseError) {
          this.errors.push(error);
          this.synchronize();
        } else {
          throw error;
        }
      }
    }

    return {
      type: 'Program',
      body,
      start,
      end: this.position(),
    };
  }

  /**
   * Get parse errors
   */
  getErrors(): ParseError[] {
    return this.errors;
  }

  // ==========================================================================
  // Top-Level Parsing
  // ==========================================================================

  private parseTopLevel(): Block | Statement | PluginDirective | SectionSeparator | StateProposal | null {
    // Section separator ---
    if (this.check(TokenType.SECTION_SEP)) {
      return this.parseSectionSeparator();
    }

    // @ constructs
    if (this.check(TokenType.AT_IDENTIFIER)) {
      const atToken = this.peek();
      const keyword = atToken.value;

      switch (keyword) {
        case 'atomic':
        case 'block':
        case 'system':
        case 'container':
        case 'region':
        case 'entity':
        case 'slot':
          return this.parseAtomicBlock();

        case 'dom':
          return this.parseDomBlock();

        case 'component':
          return this.parseComponentDef();

        case 'propose':
          return this.parseStateProposal();

        case 'use':
          return this.parsePluginDirective();

        case 'if':
          return this.parseIfStatement();

        case 'for':
          return this.parseForStatement();

        case 'while':
          return this.parseWhileStatement();

        case 'do':
          return this.parseDoWhileStatement();

        case 'switch':
          return this.parseSwitchStatement();

        case 'set':
          return this.parseAssignmentStatement();

        case 'call':
          return this.parseServerCall();

        case 'on':
          return this.parseBinaryTrigger();

        case 'reactor':
          return this.parseReactorBlock();

        default:
          // Generic atomic block with custom type
          return this.parseAtomicBlock();
      }
    }

    // Skip unknown tokens
    this.advance();
    return null;
  }

  // ==========================================================================
  // Block Parsing
  // ==========================================================================

  private parseAtomicBlock(): AtomicBlock {
    const start = this.position();
    const atToken = this.consume(TokenType.AT_IDENTIFIER, 'Expected @ block type');
    const blockType = atToken.value;

    // Block ID can be in brackets [identifier] or bare identifier
    let id: string | undefined;
    if (this.check(TokenType.LBRACKET)) {
      this.advance();
      const idToken = this.consume(TokenType.IDENTIFIER, 'Expected block identifier');
      id = idToken.value;
      this.consume(TokenType.RBRACKET, 'Expected ]');
    } else if (this.check(TokenType.IDENTIFIER)) {
      // Bare identifier: @block myId { ... }
      id = this.advance().value;
    }

    // Block body { ... }
    this.consume(TokenType.LBRACE, 'Expected {');
    const body = this.parseBlockBody();
    this.consume(TokenType.RBRACE, 'Expected }');

    return {
      type: 'AtomicBlock',
      blockType,
      id,
      body,
      start,
      end: this.position(),
    };
  }

  private parseDomBlock(): DomBlock {
    const start = this.position();
    this.consume(TokenType.AT_IDENTIFIER, 'Expected @dom');

    // selector[id] or just selector
    const selectorToken = this.consume(TokenType.IDENTIFIER, 'Expected DOM selector');
    let selector = selectorToken.value;

    let id: string | undefined;
    if (this.check(TokenType.LBRACKET)) {
      this.advance();
      if (this.check(TokenType.IDENTIFIER) || this.check(TokenType.STRING)) {
        const idToken = this.advance();
        id = idToken.value;
      } else if (this.check(TokenType.BLOCK_REF)) {
        const idToken = this.advance();
        id = '#' + idToken.value;
      }
      this.consume(TokenType.RBRACKET, 'Expected ]');
    }

    this.consume(TokenType.LBRACE, 'Expected {');
    const body = this.parseBlockBody();
    this.consume(TokenType.RBRACE, 'Expected }');

    return {
      type: 'DomBlock',
      selector,
      id,
      body,
      start,
      end: this.position(),
    };
  }

  private parseComponentDef(): ComponentDef {
    const start = this.position();
    this.consume(TokenType.AT_IDENTIFIER, 'Expected @component');
    const nameToken = this.consume(TokenType.IDENTIFIER, 'Expected component name');

    this.consume(TokenType.LBRACE, 'Expected {');
    const body = this.parseBlockBody();
    this.consume(TokenType.RBRACE, 'Expected }');

    return {
      type: 'ComponentDef',
      name: nameToken.value,
      body,
      start,
      end: this.position(),
    };
  }

  private parseBlockBody(): BlockBodyItem[] {
    const items: BlockBodyItem[] = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      this.skipNewlines();
      if (this.check(TokenType.RBRACE)) break;

      const item = this.parseBlockBodyItem();
      if (item) {
        items.push(item);
      }
      this.skipNewlines();
    }

    return items;
  }

  private parseBlockBodyItem(): BlockBodyItem | null {
    // Nested blocks
    if (this.check(TokenType.AT_IDENTIFIER)) {
      const atToken = this.peek();
      const keyword = atToken.value;

      // Check for nested blocks
      if (['atomic', 'block', 'dom', 'system', 'container', 'region', 'entity', 'slot'].includes(keyword)) {
        return this.parseAtomicBlock();
      }
      if (keyword === 'dom') {
        return this.parseDomBlock();
      }
      if (keyword === 'if') {
        return this.parseIfStatement();
      }
      if (keyword === 'for') {
        return this.parseForStatement();
      }
      if (keyword === 'while') {
        return this.parseWhileStatement();
      }
      if (keyword === 'set') {
        return this.parseAssignmentStatement();
      }
      if (keyword === 'call') {
        return this.parseServerCall();
      }

      // Otherwise treat as @property: value
      return this.parseAtPropertyAssignment();
    }

    // Regular property: value
    if (this.check(TokenType.IDENTIFIER)) {
      return this.parsePropertyAssignment();
    }

    // Skip newlines and semicolons
    if (this.check(TokenType.NEWLINE) || this.check(TokenType.SEMICOLON)) {
      this.advance();
      return null;
    }

    // Array literal
    if (this.check(TokenType.LBRACKET)) {
      const expr = this.parseArrayExpression();
      return {
        type: 'PropertyAssignment',
        name: '_array',
        isAtProperty: false,
        value: expr,
        start: expr.start,
        end: expr.end,
      } as PropertyAssignment;
    }

    this.advance();
    return null;
  }

  private parsePropertyAssignment(): PropertyAssignment {
    const start = this.position();
    const nameToken = this.consume(TokenType.IDENTIFIER, 'Expected property name');
    this.consume(TokenType.COLON, 'Expected :');
    const value = this.parseExpression();

    // Optional semicolon
    if (this.check(TokenType.SEMICOLON)) {
      this.advance();
    }

    return {
      type: 'PropertyAssignment',
      name: nameToken.value,
      isAtProperty: false,
      value,
      start,
      end: this.position(),
    };
  }

  private parseAtPropertyAssignment(): PropertyAssignment {
    const start = this.position();
    const atToken = this.consume(TokenType.AT_IDENTIFIER, 'Expected @property');
    this.consume(TokenType.COLON, 'Expected :');
    const value = this.parseExpression();

    if (this.check(TokenType.SEMICOLON)) {
      this.advance();
    }

    return {
      type: 'PropertyAssignment',
      name: atToken.value,
      isAtProperty: true,
      value,
      start,
      end: this.position(),
    };
  }

  // ==========================================================================
  // Expression Parsing (Precedence Climbing)
  // ==========================================================================

  private parseExpression(): Expression {
    return this.parseOrExpression();
  }

  private parseOrExpression(): Expression {
    let left = this.parseAndExpression();

    while (this.check(TokenType.OR)) {
      const op = this.advance().value;
      const right = this.parseAndExpression();
      left = {
        type: 'BinaryExpression',
        operator: op,
        left,
        right,
        start: left.start,
        end: right.end,
      } as BinaryExpression;
    }

    return left;
  }

  private parseAndExpression(): Expression {
    let left = this.parseEqualityExpression();

    while (this.check(TokenType.AND)) {
      const op = this.advance().value;
      const right = this.parseEqualityExpression();
      left = {
        type: 'BinaryExpression',
        operator: op,
        left,
        right,
        start: left.start,
        end: right.end,
      } as BinaryExpression;
    }

    return left;
  }

  private parseEqualityExpression(): Expression {
    let left = this.parseComparisonExpression();

    while (
      this.check(TokenType.EQ) ||
      this.check(TokenType.NEQ) ||
      this.check(TokenType.STRICT_EQ) ||
      this.check(TokenType.STRICT_NEQ)
    ) {
      const op = this.advance().value;
      const right = this.parseComparisonExpression();
      left = {
        type: 'BinaryExpression',
        operator: op,
        left,
        right,
        start: left.start,
        end: right.end,
      } as BinaryExpression;
    }

    return left;
  }

  private parseComparisonExpression(): Expression {
    let left = this.parseAdditiveExpression();

    while (
      this.check(TokenType.LT) ||
      this.check(TokenType.GT) ||
      this.check(TokenType.LTE) ||
      this.check(TokenType.GTE)
    ) {
      const op = this.advance().value;
      const right = this.parseAdditiveExpression();
      left = {
        type: 'BinaryExpression',
        operator: op,
        left,
        right,
        start: left.start,
        end: right.end,
      } as BinaryExpression;
    }

    return left;
  }

  private parseAdditiveExpression(): Expression {
    let left = this.parseMultiplicativeExpression();

    while (this.check(TokenType.PLUS) || this.check(TokenType.MINUS)) {
      const op = this.advance().value;
      const right = this.parseMultiplicativeExpression();
      left = {
        type: 'BinaryExpression',
        operator: op,
        left,
        right,
        start: left.start,
        end: right.end,
      } as BinaryExpression;
    }

    return left;
  }

  private parseMultiplicativeExpression(): Expression {
    let left = this.parseUnaryExpression();

    while (this.check(TokenType.STAR) || this.check(TokenType.SLASH) || this.check(TokenType.PERCENT)) {
      const op = this.advance().value;
      const right = this.parseUnaryExpression();
      left = {
        type: 'BinaryExpression',
        operator: op,
        left,
        right,
        start: left.start,
        end: right.end,
      } as BinaryExpression;
    }

    return left;
  }

  private parseUnaryExpression(): Expression {
    if (this.check(TokenType.NOT) || this.check(TokenType.MINUS)) {
      const start = this.position();
      const op = this.advance().value;
      const argument = this.parseUnaryExpression();
      return {
        type: 'UnaryExpression',
        operator: op,
        argument,
        start,
        end: argument.end,
      } as UnaryExpression;
    }

    return this.parsePrimaryExpression();
  }

  private parsePrimaryExpression(): Expression {
    const start = this.position();

    // Reference {{path}}
    if (this.check(TokenType.REFERENCE)) {
      const token = this.advance();
      return {
        type: 'Reference',
        path: token.value,
        start,
        end: this.position(),
      } as Reference;
    }

    // Block reference #name
    if (this.check(TokenType.BLOCK_REF)) {
      const token = this.advance();
      return {
        type: 'BlockReference',
        name: token.value,
        start,
        end: this.position(),
      } as BlockReference;
    }

    // String literal
    if (this.check(TokenType.STRING)) {
      const token = this.advance();
      return {
        type: 'Literal',
        value: token.value,
        raw: `"${token.value}"`,
        start,
        end: this.position(),
      } as Literal;
    }

    // Number literal
    if (this.check(TokenType.NUMBER)) {
      const token = this.advance();
      return {
        type: 'Literal',
        value: parseFloat(token.value),
        raw: token.value,
        start,
        end: this.position(),
      } as Literal;
    }

    // Boolean literal
    if (this.check(TokenType.BOOLEAN)) {
      const token = this.advance();
      return {
        type: 'Literal',
        value: token.value === 'true',
        raw: token.value,
        start,
        end: this.position(),
      } as Literal;
    }

    // Null literal
    if (this.check(TokenType.NULL)) {
      this.advance();
      return {
        type: 'Literal',
        value: null,
        raw: 'null',
        start,
        end: this.position(),
      } as Literal;
    }

    // Array literal
    if (this.check(TokenType.LBRACKET)) {
      return this.parseArrayExpression();
    }

    // Object literal
    if (this.check(TokenType.LBRACE)) {
      return this.parseObjectExpression();
    }

    // Parenthesized expression or lambda
    if (this.check(TokenType.LPAREN)) {
      return this.parseParenOrLambda();
    }

    // Identifier
    if (this.check(TokenType.IDENTIFIER)) {
      const token = this.advance();
      return {
        type: 'Identifier',
        name: token.value,
        start,
        end: this.position(),
      } as Identifier;
    }

    // @ identifier as expression (e.g., block type names)
    if (this.check(TokenType.AT_IDENTIFIER)) {
      const token = this.advance();
      return {
        type: 'Identifier',
        name: '@' + token.value,
        start,
        end: this.position(),
      } as Identifier;
    }

    throw new ParseError('Unexpected token', start, this.peek());
  }

  private parseArrayExpression(): ArrayExpression {
    const start = this.position();
    this.consume(TokenType.LBRACKET, 'Expected [');

    const elements: Expression[] = [];
    this.skipNewlines();

    while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
      // Handle nested @ blocks in arrays
      if (this.check(TokenType.AT_IDENTIFIER)) {
        const block = this.parseAtomicBlock();
        // Convert block to expression-like form
        elements.push({
          type: 'Identifier',
          name: `@${block.blockType}${block.id ? `[${block.id}]` : ''}`,
          start: block.start,
          end: block.end,
        } as Identifier);
      } else {
        elements.push(this.parseExpression());
      }

      this.skipNewlines();
      if (this.check(TokenType.COMMA)) {
        this.advance();
        this.skipNewlines();
      }
    }

    this.consume(TokenType.RBRACKET, 'Expected ]');

    return {
      type: 'ArrayExpression',
      elements,
      start,
      end: this.position(),
    };
  }

  private parseObjectExpression(): ObjectExpression {
    const start = this.position();
    this.consume(TokenType.LBRACE, 'Expected {');

    const properties: PropertyAssignment[] = [];
    this.skipNewlines();

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.check(TokenType.IDENTIFIER) || this.check(TokenType.STRING)) {
        const nameToken = this.advance();
        this.consume(TokenType.COLON, 'Expected :');
        const value = this.parseExpression();

        properties.push({
          type: 'PropertyAssignment',
          name: nameToken.value,
          isAtProperty: false,
          value,
          start: nameToken.start,
          end: value.end,
        });
      }

      this.skipNewlines();
      if (this.check(TokenType.COMMA)) {
        this.advance();
        this.skipNewlines();
      }
    }

    this.consume(TokenType.RBRACE, 'Expected }');

    return {
      type: 'ObjectExpression',
      properties,
      start,
      end: this.position(),
    };
  }

  private parseParenOrLambda(): Expression {
    const start = this.position();
    this.consume(TokenType.LPAREN, 'Expected (');

    // Check if this is a lambda: (params) => body
    const savedPos = this.pos;

    // Try to parse as lambda parameters
    const params: Identifier[] = [];
    let isLambda = false;

    this.skipNewlines();
    while (!this.check(TokenType.RPAREN) && !this.isAtEnd()) {
      if (!this.check(TokenType.IDENTIFIER)) break;
      const param = this.advance();
      params.push({
        type: 'Identifier',
        name: param.value,
        start: param.start,
        end: param.end,
      });
      this.skipNewlines();
      if (this.check(TokenType.COMMA)) {
        this.advance();
        this.skipNewlines();
      }
    }

    if (this.check(TokenType.RPAREN)) {
      this.advance();
      if (this.check(TokenType.FAT_ARROW)) {
        isLambda = true;
      }
    }

    if (isLambda) {
      this.consume(TokenType.FAT_ARROW, 'Expected =>');
      let body: BlockBodyItem[];

      if (this.check(TokenType.LBRACE)) {
        this.advance();
        body = this.parseBlockBody();
        this.consume(TokenType.RBRACE, 'Expected }');
      } else {
        const expr = this.parseExpression();
        body = [
          {
            type: 'PropertyAssignment',
            name: '_return',
            isAtProperty: false,
            value: expr,
            start: expr.start,
            end: expr.end,
          } as PropertyAssignment,
        ];
      }

      return {
        type: 'LambdaExpression',
        params,
        body,
        start,
        end: this.position(),
      } as LambdaExpression;
    }

    // Restore position and parse as parenthesized expression
    this.pos = savedPos;
    this.skipNewlines();
    const expr = this.parseExpression();
    this.consume(TokenType.RPAREN, 'Expected )');
    return expr;
  }

  // ==========================================================================
  // Statement Parsing
  // ==========================================================================

  private parseIfStatement(): IfStatement {
    const start = this.position();
    this.consume(TokenType.AT_IDENTIFIER, 'Expected @if');
    this.consume(TokenType.LPAREN, 'Expected (');
    const condition = this.parseExpression();
    this.consume(TokenType.RPAREN, 'Expected )');

    this.consume(TokenType.LBRACE, 'Expected {');
    const consequent = this.parseBlockBody();
    this.consume(TokenType.RBRACE, 'Expected }');

    let alternate: BlockBodyItem[] | IfStatement | undefined;

    this.skipNewlines();
    if (this.check(TokenType.AT_IDENTIFIER) && this.peek().value === 'else') {
      this.advance();
      this.skipNewlines();

      if (this.check(TokenType.AT_IDENTIFIER) && this.peek().value === 'if') {
        alternate = this.parseIfStatement();
      } else {
        this.consume(TokenType.LBRACE, 'Expected {');
        alternate = this.parseBlockBody();
        this.consume(TokenType.RBRACE, 'Expected }');
      }
    }

    return {
      type: 'IfStatement',
      condition,
      consequent,
      alternate,
      start,
      end: this.position(),
    };
  }

  private parseForStatement(): ForStatement {
    const start = this.position();
    this.consume(TokenType.AT_IDENTIFIER, 'Expected @for');
    this.consume(TokenType.LPAREN, 'Expected (');

    let iterator: string | undefined;
    let iterable: Expression | undefined;
    let init: Expression | undefined;
    let test: Expression | undefined;
    let update: Expression | undefined;

    // Check for "identifier in expression" vs "init; test; update"
    if (this.check(TokenType.IDENTIFIER)) {
      const first = this.advance();

      if (this.check(TokenType.IDENTIFIER) && this.peek().value === 'in') {
        // for (x in items)
        this.advance(); // skip 'in'
        iterator = first.value;
        iterable = this.parseExpression();
      } else {
        // C-style for loop - restore and parse differently
        this.pos--;
        init = this.parseExpression();
        this.consume(TokenType.SEMICOLON, 'Expected ;');
        test = this.parseExpression();
        this.consume(TokenType.SEMICOLON, 'Expected ;');
        if (!this.check(TokenType.RPAREN)) {
          update = this.parseExpression();
        }
      }
    }

    this.consume(TokenType.RPAREN, 'Expected )');
    this.consume(TokenType.LBRACE, 'Expected {');
    const body = this.parseBlockBody();
    this.consume(TokenType.RBRACE, 'Expected }');

    return {
      type: 'ForStatement',
      iterator,
      iterable,
      init,
      test,
      update,
      body,
      start,
      end: this.position(),
    };
  }

  private parseWhileStatement(): WhileStatement {
    const start = this.position();
    this.consume(TokenType.AT_IDENTIFIER, 'Expected @while');
    this.consume(TokenType.LPAREN, 'Expected (');
    const condition = this.parseExpression();
    this.consume(TokenType.RPAREN, 'Expected )');

    this.consume(TokenType.LBRACE, 'Expected {');
    const body = this.parseBlockBody();
    this.consume(TokenType.RBRACE, 'Expected }');

    return {
      type: 'WhileStatement',
      condition,
      body,
      start,
      end: this.position(),
    };
  }

  private parseDoWhileStatement(): DoWhileStatement {
    const start = this.position();
    this.consume(TokenType.AT_IDENTIFIER, 'Expected @do');

    this.consume(TokenType.LBRACE, 'Expected {');
    const body = this.parseBlockBody();
    this.consume(TokenType.RBRACE, 'Expected }');

    this.consume(TokenType.AT_IDENTIFIER, 'Expected @while');
    this.consume(TokenType.LPAREN, 'Expected (');
    const condition = this.parseExpression();
    this.consume(TokenType.RPAREN, 'Expected )');

    return {
      type: 'DoWhileStatement',
      body,
      condition,
      start,
      end: this.position(),
    };
  }

  private parseSwitchStatement(): SwitchStatement {
    const start = this.position();
    this.consume(TokenType.AT_IDENTIFIER, 'Expected @switch');
    this.consume(TokenType.LPAREN, 'Expected (');
    const discriminant = this.parseExpression();
    this.consume(TokenType.RPAREN, 'Expected )');

    this.consume(TokenType.LBRACE, 'Expected {');

    const cases: SwitchCase[] = [];
    this.skipNewlines();

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.check(TokenType.AT_IDENTIFIER)) {
        const keyword = this.peek().value;

        if (keyword === 'case') {
          this.advance();
          const test = this.parseExpression();
          this.consume(TokenType.COLON, 'Expected :');
          this.consume(TokenType.LBRACE, 'Expected {');
          const consequent = this.parseBlockBody();
          this.consume(TokenType.RBRACE, 'Expected }');

          cases.push({
            type: 'SwitchCase',
            test,
            consequent,
            start: test.start,
            end: this.position(),
          });
        } else if (keyword === 'default') {
          this.advance();
          this.consume(TokenType.COLON, 'Expected :');
          this.consume(TokenType.LBRACE, 'Expected {');
          const consequent = this.parseBlockBody();
          this.consume(TokenType.RBRACE, 'Expected }');

          cases.push({
            type: 'SwitchCase',
            test: null,
            consequent,
            start: this.position(),
            end: this.position(),
          });
        }
      }
      this.skipNewlines();
    }

    this.consume(TokenType.RBRACE, 'Expected }');

    return {
      type: 'SwitchStatement',
      discriminant,
      cases,
      start,
      end: this.position(),
    };
  }

  private parseAssignmentStatement(): AssignmentStatement {
    const start = this.position();
    this.consume(TokenType.AT_IDENTIFIER, 'Expected @set');
    const targetToken = this.consume(TokenType.IDENTIFIER, 'Expected variable name');
    this.consume(TokenType.EQUALS, 'Expected =');
    const value = this.parseExpression();

    if (this.check(TokenType.SEMICOLON)) {
      this.advance();
    }

    return {
      type: 'AssignmentStatement',
      target: targetToken.value,
      value,
      start,
      end: this.position(),
    };
  }

  private parseServerCall(): ServerCall {
    const start = this.position();
    this.consume(TokenType.AT_IDENTIFIER, 'Expected @call');

    // Target: URL or #function_ref
    let target: string | Expression;
    if (this.check(TokenType.BLOCK_REF)) {
      const refToken = this.advance();
      target = '#' + refToken.value;
    } else if (this.check(TokenType.STRING)) {
      target = this.advance().value;
    } else if (this.check(TokenType.IDENTIFIER)) {
      target = this.advance().value;
    } else {
      target = this.parseExpression();
    }

    // Optional modifiers [async, stream, ...]
    const modifiers: string[] = [];
    if (this.check(TokenType.LBRACKET)) {
      this.advance();
      while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
        if (this.check(TokenType.IDENTIFIER)) {
          modifiers.push(this.advance().value);
        }
        if (this.check(TokenType.COMMA)) {
          this.advance();
        }
      }
      this.consume(TokenType.RBRACKET, 'Expected ]');
    }

    // Arguments (name: value, ...)
    this.consume(TokenType.LPAREN, 'Expected (');
    const args: NamedArgument[] = [];
    this.skipNewlines();

    while (!this.check(TokenType.RPAREN) && !this.isAtEnd()) {
      const nameToken = this.consume(TokenType.IDENTIFIER, 'Expected argument name');
      this.consume(TokenType.COLON, 'Expected :');
      const value = this.parseExpression();

      args.push({
        type: 'NamedArgument',
        name: nameToken.value,
        value,
        start: nameToken.start,
        end: value.end,
      });

      this.skipNewlines();
      if (this.check(TokenType.COMMA)) {
        this.advance();
        this.skipNewlines();
      }
    }

    this.consume(TokenType.RPAREN, 'Expected )');

    // Optional return handler -> expr
    let returnHandler: Expression | undefined;
    if (this.check(TokenType.ARROW)) {
      this.advance();
      returnHandler = this.parseExpression();
    }

    if (this.check(TokenType.SEMICOLON)) {
      this.advance();
    }

    return {
      type: 'ServerCall',
      target,
      modifiers,
      arguments: args,
      returnHandler,
      start,
      end: this.position(),
    };
  }

  private parseBinaryTrigger(): BinaryTrigger {
    const start = this.position();
    this.consume(TokenType.AT_IDENTIFIER, 'Expected @on');

    const sourceToken = this.consume(TokenType.IDENTIFIER, 'Expected trigger source');
    const source = sourceToken.value;

    let filter: string | undefined;
    if (this.check(TokenType.IDENTIFIER)) {
      filter = this.advance().value;
    }

    this.consume(TokenType.LBRACE, 'Expected {');
    const body = this.parseBlockBody();
    this.consume(TokenType.RBRACE, 'Expected }');

    return {
      type: 'BinaryTrigger',
      source,
      filter,
      body: body as (Statement)[],
      start,
      end: this.position(),
    };
  }

  private parseReactorBlock(): ReactorBlock {
    const start = this.position();
    this.consume(TokenType.AT_IDENTIFIER, 'Expected @reactor');
    const nameToken = this.consume(TokenType.IDENTIFIER, 'Expected reactor name');

    this.consume(TokenType.LBRACE, 'Expected {');
    const body: (BinaryTrigger | TimerBlock | Statement)[] = [];

    this.skipNewlines();
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.check(TokenType.AT_IDENTIFIER)) {
        const keyword = this.peek().value;
        if (keyword === 'on') {
          body.push(this.parseBinaryTrigger());
        } else if (keyword === 'every') {
          body.push(this.parseTimerBlock());
        } else {
          const item = this.parseBlockBodyItem();
          if (item) body.push(item as Statement);
        }
      }
      this.skipNewlines();
    }

    this.consume(TokenType.RBRACE, 'Expected }');

    return {
      type: 'ReactorBlock',
      name: nameToken.value,
      body,
      start,
      end: this.position(),
    };
  }

  private parseTimerBlock(): TimerBlock {
    const start = this.position();
    this.consume(TokenType.AT_IDENTIFIER, 'Expected @every');
    const intervalToken = this.consume(TokenType.STRING, 'Expected interval string');

    this.consume(TokenType.LBRACE, 'Expected {');
    const body = this.parseBlockBody();
    this.consume(TokenType.RBRACE, 'Expected }');

    return {
      type: 'TimerBlock',
      interval: intervalToken.value,
      body,
      start,
      end: this.position(),
    };
  }

  // ==========================================================================
  // State Proposals
  // ==========================================================================

  private parseStateProposal(): StateProposal {
    const start = this.position();
    this.consume(TokenType.AT_IDENTIFIER, 'Expected @propose');

    this.consume(TokenType.LBRACE, 'Expected {');
    this.skipNewlines();

    let prior: Expression = { type: 'Literal', value: null, raw: 'null', start, end: start } as Literal;
    let next: StateDefinition | undefined;
    const constraints: Constraint[] = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.check(TokenType.IDENTIFIER)) {
        const key = this.advance().value;
        this.consume(TokenType.COLON, 'Expected :');

        if (key === 'prior') {
          prior = this.parseExpression();
        } else if (key === 'next') {
          next = this.parseStateDefinition();
        } else if (key === 'constraints') {
          this.consume(TokenType.LBRACKET, 'Expected [');
          while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
            if (this.check(TokenType.AT_IDENTIFIER)) {
              const constraintToken = this.advance();
              const constraint: Constraint = {
                type: 'Constraint',
                name: constraintToken.value,
                start: constraintToken.start,
                end: constraintToken.end,
              };

              if (this.check(TokenType.LPAREN)) {
                this.advance();
                constraint.arguments = [];
                while (!this.check(TokenType.RPAREN) && !this.isAtEnd()) {
                  constraint.arguments.push(this.parseExpression());
                  if (this.check(TokenType.COMMA)) this.advance();
                }
                this.consume(TokenType.RPAREN, 'Expected )');
              }

              constraints.push(constraint);
            }
            this.skipNewlines();
            if (this.check(TokenType.COMMA)) this.advance();
            this.skipNewlines();
          }
          this.consume(TokenType.RBRACKET, 'Expected ]');
        }
      }
      this.skipNewlines();
      if (this.check(TokenType.COMMA)) this.advance();
      this.skipNewlines();
    }

    this.consume(TokenType.RBRACE, 'Expected }');

    if (!next) {
      throw new ParseError('State proposal requires "next" field', start);
    }

    return {
      type: 'StateProposal',
      prior,
      next,
      constraints,
      start,
      end: this.position(),
    };
  }

  private parseStateDefinition(): StateDefinition {
    const start = this.position();
    this.consume(TokenType.LBRACE, 'Expected {');
    this.skipNewlines();

    const blocks: Block[] = [];
    let phase = 'execution';
    let epoch = 0;

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.check(TokenType.IDENTIFIER)) {
        const key = this.advance().value;
        this.consume(TokenType.COLON, 'Expected :');

        if (key === 'blocks') {
          this.consume(TokenType.LBRACKET, 'Expected [');
          this.skipNewlines();
          while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
            if (this.check(TokenType.AT_IDENTIFIER)) {
              blocks.push(this.parseAtomicBlock());
            }
            this.skipNewlines();
            if (this.check(TokenType.COMMA)) this.advance();
            this.skipNewlines();
          }
          this.consume(TokenType.RBRACKET, 'Expected ]');
        } else if (key === 'phase') {
          const phaseToken = this.consume(TokenType.IDENTIFIER, 'Expected phase name');
          phase = phaseToken.value;
        } else if (key === 'epoch') {
          const epochToken = this.consume(TokenType.NUMBER, 'Expected epoch number');
          epoch = parseInt(epochToken.value, 10);
        }
      }
      this.skipNewlines();
      if (this.check(TokenType.COMMA)) this.advance();
      this.skipNewlines();
    }

    this.consume(TokenType.RBRACE, 'Expected }');

    return {
      type: 'StateDefinition',
      blocks,
      phase,
      epoch,
      start,
      end: this.position(),
    };
  }

  // ==========================================================================
  // Plugin Directives
  // ==========================================================================

  private parsePluginDirective(): PluginDirective {
    const start = this.position();
    this.consume(TokenType.AT_IDENTIFIER, 'Expected @use');

    // @use plugin "name" from "source" with { config }
    this.consume(TokenType.IDENTIFIER, 'Expected "plugin" keyword');

    let name: string;
    if (this.check(TokenType.STRING)) {
      name = this.advance().value;
    } else {
      name = this.consume(TokenType.IDENTIFIER, 'Expected plugin name').value;
    }

    let source: string | undefined;
    if (this.check(TokenType.IDENTIFIER) && this.peek().value === 'from') {
      this.advance();
      source = this.consume(TokenType.STRING, 'Expected source string').value;
    }

    let config: ObjectExpression | undefined;
    if (this.check(TokenType.IDENTIFIER) && this.peek().value === 'with') {
      this.advance();
      config = this.parseObjectExpression();
    }

    if (this.check(TokenType.SEMICOLON)) {
      this.advance();
    }

    return {
      type: 'PluginDirective',
      name,
      source,
      config,
      start,
      end: this.position(),
    };
  }

  private parseSectionSeparator(): SectionSeparator {
    const start = this.position();
    this.consume(TokenType.SECTION_SEP, 'Expected ---');

    return {
      type: 'SectionSeparator',
      start,
      end: this.position(),
    };
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private isAtEnd(): boolean {
    return this.pos >= this.tokens.length || this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.pos++;
    }
    return this.tokens[this.pos - 1];
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }
    throw new ParseError(message, this.position(), this.peek());
  }

  private position(): Position {
    const token = this.tokens[this.pos] || this.tokens[this.tokens.length - 1];
    return token.start;
  }

  private skipNewlines(): void {
    while (this.check(TokenType.NEWLINE)) {
      this.advance();
    }
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.peek().type === TokenType.NEWLINE) {
        this.advance();
        return;
      }

      if (this.peek().type === TokenType.AT_IDENTIFIER) {
        return;
      }

      this.advance();
    }
  }
}

/**
 * Parse ASXR source code into AST
 */
export function parse(source: string): Program {
  const parser = new Parser(source);
  return parser.parse();
}
