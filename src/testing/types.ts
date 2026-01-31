/**
 * ASXR Testing Framework Types
 */

import type { Program } from '../parser/ast.js';

/**
 * Test case definition
 */
export interface TestCase {
  name: string;
  description?: string;
  source: string;
  only?: boolean;
  skip?: boolean;
  timeout?: number;
  tags?: string[];
}

/**
 * Test suite definition
 */
export interface TestSuite {
  name: string;
  description?: string;
  tests: TestCase[];
  beforeAll?: () => void | Promise<void>;
  afterAll?: () => void | Promise<void>;
  beforeEach?: () => void | Promise<void>;
  afterEach?: () => void | Promise<void>;
}

/**
 * Test result for a single test
 */
export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'timeout';
  duration: number;
  error?: Error;
  assertions: AssertionResult[];
  snapshots?: SnapshotResult[];
}

/**
 * Assertion result
 */
export interface AssertionResult {
  assertion: string;
  passed: boolean;
  expected?: unknown;
  actual?: unknown;
  message?: string;
}

/**
 * Snapshot result
 */
export interface SnapshotResult {
  name: string;
  status: 'matched' | 'updated' | 'new' | 'failed';
  diff?: string;
}

/**
 * Suite result
 */
export interface SuiteResult {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

/**
 * Full test run result
 */
export interface TestRunResult {
  suites: SuiteResult[];
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  totalDuration: number;
  snapshotsUpdated: number;
  snapshotsNew: number;
}

/**
 * Test context passed to assertions
 */
export interface TestContext {
  source: string;
  ast?: Program;
  compiled?: string;
  errors: Error[];
  addAssertion(result: AssertionResult): void;
  addSnapshot(result: SnapshotResult): void;
}

/**
 * Test reporter interface
 */
export interface TestReporter {
  onSuiteStart(suite: TestSuite): void;
  onSuiteEnd(result: SuiteResult): void;
  onTestStart(test: TestCase): void;
  onTestEnd(result: TestResult): void;
  onRunStart(): void;
  onRunEnd(result: TestRunResult): void;
}

/**
 * Test runner options
 */
export interface TestRunnerOptions {
  /** Update snapshots instead of comparing */
  updateSnapshots?: boolean;
  /** Only run tests with .only */
  onlyMode?: boolean;
  /** Filter tests by tag */
  tags?: string[];
  /** Filter tests by name pattern */
  filter?: RegExp;
  /** Default timeout in ms */
  timeout?: number;
  /** Reporter to use */
  reporter?: TestReporter;
  /** Snapshot directory */
  snapshotDir?: string;
  /** Run tests in parallel */
  parallel?: boolean;
  /** Max parallel workers */
  maxWorkers?: number;
}

/**
 * Expectation builder
 */
export interface Expect {
  /** Assert value equals expected */
  toBe(expected: unknown): void;
  /** Assert value deeply equals expected */
  toEqual(expected: unknown): void;
  /** Assert value is truthy */
  toBeTruthy(): void;
  /** Assert value is falsy */
  toBeFalsy(): void;
  /** Assert value is null */
  toBeNull(): void;
  /** Assert value is undefined */
  toBeUndefined(): void;
  /** Assert value is defined */
  toBeDefined(): void;
  /** Assert value contains substring or array element */
  toContain(item: unknown): void;
  /** Assert value has length */
  toHaveLength(length: number): void;
  /** Assert value has property */
  toHaveProperty(path: string, value?: unknown): void;
  /** Assert value matches regex */
  toMatch(regex: RegExp): void;
  /** Assert function throws */
  toThrow(message?: string | RegExp): void;
  /** Assert AST node type */
  toBeNodeType(type: string): void;
  /** Assert AST matches structure */
  toMatchAST(structure: Record<string, unknown>): void;
  /** Assert matches snapshot */
  toMatchSnapshot(name?: string): void;
  /** Negate the assertion */
  not: Expect;
}
