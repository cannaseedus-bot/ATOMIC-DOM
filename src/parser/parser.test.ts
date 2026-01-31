/**
 * ASXR Parser Tests
 * Simple test runner without external dependencies
 */

import { parse } from './parser.js';
import { tokenize } from '../lexer/lexer.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${(error as Error).message}`);
    failed++;
  }
}

function describe(name: string, fn: () => void): void {
  console.log(`\n${name}`);
  fn();
}

// Lexer Tests
describe('Lexer', () => {
  test('should tokenize atomic block', () => {
    const tokens = tokenize('@atomic[test] { name: "hello"; }');
    assert(tokens.length > 0, 'Expected tokens');
    assertEqual(tokens[0].type, 'AT_IDENTIFIER');
    assertEqual(tokens[0].value, 'atomic');
  });

  test('should tokenize references', () => {
    const tokens = tokenize('{{user.name}}');
    const ref = tokens.find((t) => t.type === 'REFERENCE');
    assert(ref !== undefined, 'Expected reference token');
    assertEqual(ref!.value, 'user.name');
  });

  test('should tokenize block references', () => {
    const tokens = tokenize('#myBlock');
    assertEqual(tokens[0].type, 'BLOCK_REF');
    assertEqual(tokens[0].value, 'myBlock');
  });

  test('should tokenize section separators', () => {
    const tokens = tokenize('---');
    assertEqual(tokens[0].type, 'SECTION_SEP');
  });

  test('should tokenize operators', () => {
    const tokens = tokenize('=== !== => -> && ||');
    const types = tokens.filter((t) => t.type !== 'EOF').map((t) => t.type);
    assertEqual(types.join(','), 'STRICT_EQ,STRICT_NEQ,FAT_ARROW,ARROW,AND,OR');
  });
});

// Parser Tests
describe('Parser', () => {
  test('should parse empty program', () => {
    const ast = parse('');
    assertEqual(ast.type, 'Program');
    assertEqual(ast.body.length, 0);
  });

  test('should parse atomic block', () => {
    const ast = parse('@atomic[myBlock] { name: "test"; }');
    assertEqual(ast.body.length, 1);

    const block = ast.body[0];
    assertEqual(block.type, 'AtomicBlock');
    if (block.type === 'AtomicBlock') {
      assertEqual(block.blockType, 'atomic');
      assertEqual(block.id, 'myBlock');
      assertEqual(block.body.length, 1);
    }
  });

  test('should parse DOM block', () => {
    const ast = parse('@dom frame[#app] { children: []; }');
    assertEqual(ast.body.length, 1);

    const block = ast.body[0];
    assertEqual(block.type, 'DomBlock');
  });

  test('should parse nested blocks', () => {
    const source = `
      @block[parent] {
        @block[child] {
          value: 42
        }
      }
    `;
    const ast = parse(source);
    assertEqual(ast.body.length, 1);

    const parent = ast.body[0];
    assertEqual(parent.type, 'AtomicBlock');
    if (parent.type === 'AtomicBlock') {
      assert(parent.body.length > 0, 'Expected nested body');
    }
  });

  test('should parse expressions', () => {
    const ast = parse('@block[test] { value: 1 + 2 * 3; }');
    const block = ast.body[0];

    if (block.type === 'AtomicBlock') {
      const prop = block.body[0];
      if (prop.type === 'PropertyAssignment') {
        assertEqual(prop.value.type, 'BinaryExpression');
      }
    }
  });

  test('should parse if statement', () => {
    const source = `
      @if (x > 10) {
        value: true
      } @else {
        value: false
      }
    `;
    const ast = parse(source);
    assertEqual(ast.body.length, 1);
    assertEqual(ast.body[0].type, 'IfStatement');
  });

  test('should parse for statement', () => {
    const source = `
      @for (item in items) {
        name: {{item.name}}
      }
    `;
    const ast = parse(source);
    assertEqual(ast.body.length, 1);

    const stmt = ast.body[0];
    assertEqual(stmt.type, 'ForStatement');
    if (stmt.type === 'ForStatement') {
      assertEqual(stmt.iterator, 'item');
    }
  });

  test('should parse plugin directive', () => {
    const source = '@use plugin "control-flow" from "asxr-plugins/stdlib";';
    const ast = parse(source);
    assertEqual(ast.body.length, 1);

    const directive = ast.body[0];
    assertEqual(directive.type, 'PluginDirective');
    if (directive.type === 'PluginDirective') {
      assertEqual(directive.name, 'control-flow');
      assertEqual(directive.source, 'asxr-plugins/stdlib');
    }
  });

  test('should parse state proposal', () => {
    const source = `
      @propose {
        prior: null,
        next: {
          blocks: [
            @system[genesis] {
              name: "test"
            }
          ],
          phase: genesis,
          epoch: 0
        },
        constraints: [@law_invariant]
      }
    `;
    const ast = parse(source);
    assertEqual(ast.body.length, 1);
    assertEqual(ast.body[0].type, 'StateProposal');
  });

  test('should parse server call', () => {
    const source = '@call #fetchData[async, cache](userId: {{user.id}}) -> #handleResponse;';
    const ast = parse(source);
    assertEqual(ast.body.length, 1);

    const call = ast.body[0];
    assertEqual(call.type, 'ServerCall');
    if (call.type === 'ServerCall') {
      assert(call.modifiers.includes('async'), 'Expected async modifier');
      assert(call.modifiers.includes('cache'), 'Expected cache modifier');
    }
  });

  test('should parse array expressions', () => {
    const ast = parse('@block[test] { items: [1, 2, 3]; }');
    const block = ast.body[0];

    if (block.type === 'AtomicBlock') {
      const prop = block.body[0];
      if (prop.type === 'PropertyAssignment') {
        assertEqual(prop.value.type, 'ArrayExpression');
        if (prop.value.type === 'ArrayExpression') {
          assertEqual(prop.value.elements.length, 3);
        }
      }
    }
  });

  test('should parse object expressions', () => {
    const ast = parse('@block[test] { config: { a: 1, b: 2 }; }');
    const block = ast.body[0];

    if (block.type === 'AtomicBlock') {
      const prop = block.body[0];
      if (prop.type === 'PropertyAssignment') {
        assertEqual(prop.value.type, 'ObjectExpression');
      }
    }
  });

  test('should parse references in expressions', () => {
    const ast = parse('@block[test] { name: {{user.profile.name}}; }');
    const block = ast.body[0];

    if (block.type === 'AtomicBlock') {
      const prop = block.body[0];
      if (prop.type === 'PropertyAssignment') {
        assertEqual(prop.value.type, 'Reference');
        if (prop.value.type === 'Reference') {
          assertEqual(prop.value.path, 'user.profile.name');
        }
      }
    }
  });
});

// Complex Examples
describe('Complex Examples', () => {
  test('should parse TodoMVC-style component', () => {
    const source = `
      @block todo_app {
        schema: {
          todos: [],
          filter: "all"
        }
      }

      @dom component[todo-app] {
        children: [
          @dom element[header] {
            children: [
              @dom element[h1] { text: "todos" }
            ]
          }
        ]
      }
    `;

    const ast = parse(source);
    assert(ast.body.length >= 2, 'Expected at least 2 top-level items');
  });

  test('should parse reactor block', () => {
    const source = `
      @reactor dataSync {
        @on websocket-frame {
          @call #processFrame(data: {{frame.data}});
        }

        @every "30s" {
          @call #heartbeat();
        }
      }
    `;

    const ast = parse(source);
    assertEqual(ast.body.length, 1);
    assertEqual(ast.body[0].type, 'ReactorBlock');
  });
});

// Summary
console.log('\nRunning ASXR Parser Tests...');

// Print summary
console.log(`\n${'='.repeat(40)}`);
console.log(`Tests: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(40)}`);

// Report final status
if (failed > 0) {
  console.log('\nSome tests failed!');
}
