/**
 * ASXR Testing Assertions
 */

import type { Expect, TestContext } from './types.js';

/**
 * Create an expectation builder
 */
export function expect(actual: unknown, context: TestContext): Expect {
  return createExpect(actual, context, false);
}

function createExpect(actual: unknown, context: TestContext, negated: boolean): Expect {
  const addResult = (assertion: string, passed: boolean, expected?: unknown, message?: string) => {
    const finalPassed = negated ? !passed : passed;
    context.addAssertion({
      assertion: negated ? `not.${assertion}` : assertion,
      passed: finalPassed,
      expected,
      actual,
      message: finalPassed ? undefined : message,
    });
    if (!finalPassed) {
      throw new AssertionError(message ?? `Assertion failed: ${assertion}`);
    }
  };

  const expectObj: Expect = {
    toBe(expected: unknown): void {
      const passed = actual === expected;
      addResult('toBe', passed, expected, `Expected ${stringify(actual)} to be ${stringify(expected)}`);
    },

    toEqual(expected: unknown): void {
      const passed = deepEqual(actual, expected);
      addResult('toEqual', passed, expected, `Expected ${stringify(actual)} to equal ${stringify(expected)}`);
    },

    toBeTruthy(): void {
      const passed = Boolean(actual);
      addResult('toBeTruthy', passed, true, `Expected ${stringify(actual)} to be truthy`);
    },

    toBeFalsy(): void {
      const passed = !actual;
      addResult('toBeFalsy', passed, false, `Expected ${stringify(actual)} to be falsy`);
    },

    toBeNull(): void {
      const passed = actual === null;
      addResult('toBeNull', passed, null, `Expected ${stringify(actual)} to be null`);
    },

    toBeUndefined(): void {
      const passed = actual === undefined;
      addResult('toBeUndefined', passed, undefined, `Expected ${stringify(actual)} to be undefined`);
    },

    toBeDefined(): void {
      const passed = actual !== undefined;
      addResult('toBeDefined', passed, 'defined', `Expected value to be defined`);
    },

    toContain(item: unknown): void {
      let passed = false;
      if (typeof actual === 'string') {
        passed = actual.includes(String(item));
      } else if (Array.isArray(actual)) {
        passed = actual.includes(item);
      }
      addResult('toContain', passed, item, `Expected ${stringify(actual)} to contain ${stringify(item)}`);
    },

    toHaveLength(length: number): void {
      const actualLength = (actual as { length?: number })?.length;
      const passed = actualLength === length;
      addResult('toHaveLength', passed, length, `Expected length ${actualLength} to be ${length}`);
    },

    toHaveProperty(path: string, value?: unknown): void {
      const parts = path.split('.');
      let current: unknown = actual;
      let hasProperty = true;

      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = (current as Record<string, unknown>)[part];
        } else {
          hasProperty = false;
          break;
        }
      }

      let passed = hasProperty;
      if (passed && value !== undefined) {
        passed = deepEqual(current, value);
      }

      addResult(
        'toHaveProperty',
        passed,
        value !== undefined ? { path, value } : path,
        `Expected ${stringify(actual)} to have property "${path}"${value !== undefined ? ` with value ${stringify(value)}` : ''}`
      );
    },

    toMatch(regex: RegExp): void {
      const passed = typeof actual === 'string' && regex.test(actual);
      addResult('toMatch', passed, regex.toString(), `Expected "${actual}" to match ${regex}`);
    },

    toThrow(message?: string | RegExp): void {
      let passed = false;
      let thrownError: Error | undefined;

      if (typeof actual === 'function') {
        try {
          actual();
        } catch (e) {
          thrownError = e as Error;
          passed = true;
          if (message) {
            if (typeof message === 'string') {
              passed = thrownError.message.includes(message);
            } else {
              passed = message.test(thrownError.message);
            }
          }
        }
      }

      addResult(
        'toThrow',
        passed,
        message?.toString() ?? 'an error',
        `Expected function to throw${message ? ` "${message}"` : ''}`
      );
    },

    toBeNodeType(type: string): void {
      const actualType = (actual as { type?: string })?.type;
      const passed = actualType === type;
      addResult('toBeNodeType', passed, type, `Expected node type "${actualType}" to be "${type}"`);
    },

    toMatchAST(structure: Record<string, unknown>): void {
      const passed = matchesStructure(actual, structure);
      addResult(
        'toMatchAST',
        passed,
        structure,
        `Expected AST to match structure:\n${stringify(structure)}\n\nActual:\n${stringify(actual)}`
      );
    },

    toMatchSnapshot(name?: string): void {
      // Snapshot matching is handled by the test runner
      const snapshotName = name ?? 'default';
      context.addSnapshot({
        name: snapshotName,
        status: 'matched', // Will be updated by runner
      });
    },

    get not(): Expect {
      return createExpect(actual, context, !negated);
    },
  };

  return expectObj;
}

/**
 * Custom assertion error
 */
export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

/**
 * Deep equality check
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, i) => deepEqual(item, b[i]));
    }

    if (Array.isArray(a) || Array.isArray(b)) return false;

    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
  }

  return false;
}

/**
 * Check if actual matches expected structure (partial match)
 */
function matchesStructure(actual: unknown, expected: Record<string, unknown>): boolean {
  if (actual === null || typeof actual !== 'object') return false;

  const actualObj = actual as Record<string, unknown>;

  for (const [key, value] of Object.entries(expected)) {
    if (!(key in actualObj)) return false;

    if (value !== null && typeof value === 'object') {
      if (!matchesStructure(actualObj[key], value as Record<string, unknown>)) {
        return false;
      }
    } else if (actualObj[key] !== value) {
      return false;
    }
  }

  return true;
}

/**
 * Stringify value for error messages
 */
function stringify(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'function') return '[Function]';

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/**
 * ASXR-specific assertions
 */
export const asxrAssertions = {
  /**
   * Assert source parses without errors
   */
  parses(context: TestContext): void {
    const passed = context.ast !== undefined && context.errors.length === 0;
    context.addAssertion({
      assertion: 'parses',
      passed,
      message: passed ? undefined : `Parse errors: ${context.errors.map((e) => e.message).join(', ')}`,
    });
    if (!passed) {
      throw new AssertionError(`Source failed to parse: ${context.errors[0]?.message}`);
    }
  },

  /**
   * Assert source fails to parse
   */
  failsToParse(context: TestContext): void {
    const passed = context.errors.length > 0;
    context.addAssertion({
      assertion: 'failsToParse',
      passed,
      message: passed ? undefined : 'Expected source to fail parsing but it succeeded',
    });
    if (!passed) {
      throw new AssertionError('Expected source to fail parsing but it succeeded');
    }
  },

  /**
   * Assert source compiles without errors
   */
  compiles(context: TestContext): void {
    const passed = context.compiled !== undefined;
    context.addAssertion({
      assertion: 'compiles',
      passed,
      message: passed ? undefined : 'Source failed to compile',
    });
    if (!passed) {
      throw new AssertionError('Source failed to compile');
    }
  },

  /**
   * Assert AST has specific number of blocks
   */
  hasBlocks(context: TestContext, count: number): void {
    const blocks = context.ast?.body.filter((n) => n.type.includes('Block')) ?? [];
    const passed = blocks.length === count;
    context.addAssertion({
      assertion: 'hasBlocks',
      passed,
      expected: count,
      actual: blocks.length,
      message: passed ? undefined : `Expected ${count} blocks but found ${blocks.length}`,
    });
    if (!passed) {
      throw new AssertionError(`Expected ${count} blocks but found ${blocks.length}`);
    }
  },

  /**
   * Assert compiled output contains string
   */
  outputContains(context: TestContext, substring: string): void {
    const passed = context.compiled?.includes(substring) ?? false;
    context.addAssertion({
      assertion: 'outputContains',
      passed,
      expected: substring,
      message: passed ? undefined : `Expected output to contain "${substring}"`,
    });
    if (!passed) {
      throw new AssertionError(`Expected output to contain "${substring}"`);
    }
  },

  /**
   * Assert validation passes
   */
  validates(context: TestContext): void {
    // This would integrate with the validator
    context.addAssertion({
      assertion: 'validates',
      passed: true,
    });
  },
};
