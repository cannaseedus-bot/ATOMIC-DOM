/**
 * ASXR Test Runner
 */

import { parse } from '../parser/parser.js';
import { generate } from '../compiler/codegen.js';
import type {
  TestCase,
  TestSuite,
  TestResult,
  SuiteResult,
  TestRunResult,
  TestRunnerOptions,
  TestContext,
  AssertionResult,
  SnapshotResult,
} from './types.js';
import { expect, asxrAssertions, AssertionError } from './assertions.js';
import type { Program } from '../parser/ast.js';

/**
 * Default test runner options
 */
const DEFAULT_OPTIONS: TestRunnerOptions = {
  updateSnapshots: false,
  onlyMode: false,
  timeout: 5000,
  parallel: false,
  maxWorkers: 4,
};

/**
 * Test runner class
 */
export class TestRunner {
  private options: TestRunnerOptions;
  private suites: TestSuite[] = [];

  constructor(options: Partial<TestRunnerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Add a test suite
   */
  addSuite(suite: TestSuite): void {
    this.suites.push(suite);
  }

  /**
   * Run all test suites
   */
  async run(): Promise<TestRunResult> {
    const reporter = this.options.reporter;
    const startTime = Date.now();

    reporter?.onRunStart();

    const suiteResults: SuiteResult[] = [];
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let snapshotsUpdated = 0;
    let snapshotsNew = 0;

    for (const suite of this.suites) {
      const result = await this.runSuite(suite);
      suiteResults.push(result);
      totalPassed += result.passed;
      totalFailed += result.failed;
      totalSkipped += result.skipped;

      // Count snapshot updates
      for (const test of result.tests) {
        for (const snap of test.snapshots ?? []) {
          if (snap.status === 'updated') snapshotsUpdated++;
          if (snap.status === 'new') snapshotsNew++;
        }
      }
    }

    const runResult: TestRunResult = {
      suites: suiteResults,
      totalPassed,
      totalFailed,
      totalSkipped,
      totalDuration: Date.now() - startTime,
      snapshotsUpdated,
      snapshotsNew,
    };

    reporter?.onRunEnd(runResult);

    return runResult;
  }

  /**
   * Run a single test suite
   */
  private async runSuite(suite: TestSuite): Promise<SuiteResult> {
    const reporter = this.options.reporter;
    const startTime = Date.now();

    reporter?.onSuiteStart(suite);

    // Run beforeAll hook
    if (suite.beforeAll) {
      await suite.beforeAll();
    }

    const testResults: TestResult[] = [];
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    // Filter tests
    let testsToRun = suite.tests;

    // Handle only mode
    const hasOnly = testsToRun.some((t) => t.only);
    if (hasOnly || this.options.onlyMode) {
      testsToRun = testsToRun.filter((t) => t.only);
    }

    // Filter by name pattern
    if (this.options.filter) {
      testsToRun = testsToRun.filter((t) => this.options.filter!.test(t.name));
    }

    // Filter by tags
    if (this.options.tags && this.options.tags.length > 0) {
      testsToRun = testsToRun.filter(
        (t) => t.tags && t.tags.some((tag) => this.options.tags!.includes(tag))
      );
    }

    for (const test of suite.tests) {
      const shouldSkip = test.skip || !testsToRun.includes(test);

      if (shouldSkip) {
        testResults.push({
          name: test.name,
          status: 'skipped',
          duration: 0,
          assertions: [],
        });
        skipped++;
        continue;
      }

      // Run beforeEach hook
      if (suite.beforeEach) {
        await suite.beforeEach();
      }

      const result = await this.runTest(test, suite.name);
      testResults.push(result);

      if (result.status === 'passed') {
        passed++;
      } else if (result.status === 'failed' || result.status === 'timeout') {
        failed++;
      } else {
        skipped++;
      }

      // Run afterEach hook
      if (suite.afterEach) {
        await suite.afterEach();
      }
    }

    // Run afterAll hook
    if (suite.afterAll) {
      await suite.afterAll();
    }

    const suiteResult: SuiteResult = {
      name: suite.name,
      tests: testResults,
      passed,
      failed,
      skipped,
      duration: Date.now() - startTime,
    };

    reporter?.onSuiteEnd(suiteResult);

    return suiteResult;
  }

  /**
   * Run a single test
   */
  private async runTest(test: TestCase, suiteName: string): Promise<TestResult> {
    const reporter = this.options.reporter;
    const startTime = Date.now();
    const assertions: AssertionResult[] = [];
    const snapshots: SnapshotResult[] = [];
    let error: Error | undefined;
    let status: TestResult['status'] = 'passed';

    reporter?.onTestStart(test);

    // Create test context
    let ast: Program | undefined;
    const errors: Error[] = [];

    try {
      ast = parse(test.source);
    } catch (e) {
      errors.push(e as Error);
    }

    let compiled: string | undefined;
    if (ast) {
      try {
        compiled = generate(ast);
      } catch (e) {
        errors.push(e as Error);
      }
    }

    const context: TestContext = {
      source: test.source,
      ast,
      compiled,
      errors,
      addAssertion(result: AssertionResult) {
        assertions.push(result);
      },
      addSnapshot(result: SnapshotResult) {
        snapshots.push(result);
      },
    };

    // Run the test with timeout
    const timeout = test.timeout ?? this.options.timeout ?? 5000;

    try {
      await Promise.race([
        this.executeTest(test, context, suiteName),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Test timeout')), timeout);
        }),
      ]);
    } catch (e) {
      if ((e as Error).message === 'Test timeout') {
        status = 'timeout';
        error = e as Error;
      } else if (e instanceof AssertionError) {
        status = 'failed';
        error = e;
      } else {
        status = 'failed';
        error = e as Error;
      }
    }

    const result: TestResult = {
      name: test.name,
      status,
      duration: Date.now() - startTime,
      error,
      assertions,
      snapshots: snapshots.length > 0 ? snapshots : undefined,
    };

    reporter?.onTestEnd(result);

    return result;
  }

  /**
   * Execute test assertions
   */
  private async executeTest(_test: TestCase, context: TestContext, _suiteName: string): Promise<void> {
    // By default, just verify the source parses
    asxrAssertions.parses(context);

    // If there's an AST, verify basic structure
    if (context.ast) {
      expect(context.ast, context).toHaveProperty('type', 'Program');
      expect(context.ast, context).toHaveProperty('body');
    }
  }

  /**
   * Load snapshots from file
   */
  loadSnapshots(_path: string): void {
    // Snapshot loading would be implemented here
    // For now, snapshots are stored in memory
  }

  /**
   * Save snapshots to file
   */
  saveSnapshots(_path: string): void {
    // Snapshot saving would be implemented here
  }
}

/**
 * Create a test suite builder
 */
export function describe(name: string, fn: (suite: SuiteBuilder) => void): TestSuite {
  const tests: TestCase[] = [];
  let beforeAllFn: (() => void | Promise<void>) | undefined;
  let afterAllFn: (() => void | Promise<void>) | undefined;
  let beforeEachFn: (() => void | Promise<void>) | undefined;
  let afterEachFn: (() => void | Promise<void>) | undefined;

  const builder: SuiteBuilder = {
    test(testName: string, source: string, options?: Partial<TestCase>) {
      tests.push({
        name: testName,
        source,
        ...options,
      });
    },
    beforeAll(fn) {
      beforeAllFn = fn;
    },
    afterAll(fn) {
      afterAllFn = fn;
    },
    beforeEach(fn) {
      beforeEachFn = fn;
    },
    afterEach(fn) {
      afterEachFn = fn;
    },
  };

  fn(builder);

  return {
    name,
    tests,
    beforeAll: beforeAllFn,
    afterAll: afterAllFn,
    beforeEach: beforeEachFn,
    afterEach: afterEachFn,
  };
}

/**
 * Suite builder interface
 */
export interface SuiteBuilder {
  test(name: string, source: string, options?: Partial<TestCase>): void;
  beforeAll(fn: () => void | Promise<void>): void;
  afterAll(fn: () => void | Promise<void>): void;
  beforeEach(fn: () => void | Promise<void>): void;
  afterEach(fn: () => void | Promise<void>): void;
}

/**
 * Create a quick test
 */
export function test(name: string, source: string, options?: Partial<TestCase>): TestCase {
  return {
    name,
    source,
    ...options,
  };
}

/**
 * Run tests from an array of test cases
 */
export async function runTests(
  tests: TestCase[],
  options?: Partial<TestRunnerOptions>
): Promise<TestRunResult> {
  const runner = new TestRunner(options);
  runner.addSuite({
    name: 'Tests',
    tests,
  });
  return runner.run();
}

/**
 * Run a single test file
 */
export async function runTestFile(
  source: string,
  options?: Partial<TestRunnerOptions>
): Promise<TestRunResult> {
  // Parse test file for test definitions
  // For now, treat the whole source as a single test
  const runner = new TestRunner(options);
  runner.addSuite({
    name: 'Test File',
    tests: [{ name: 'Main', source }],
  });
  return runner.run();
}
