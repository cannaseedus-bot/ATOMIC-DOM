/**
 * ASXR Testing Framework
 * Test runner and assertions for ASXR blocks
 */

// Types
export type {
  TestCase,
  TestSuite,
  TestResult,
  SuiteResult,
  TestRunResult,
  TestContext,
  TestRunnerOptions,
  TestReporter,
  AssertionResult,
  SnapshotResult,
  Expect,
} from './types.js';

// Runner
export {
  TestRunner,
  describe,
  test,
  runTests,
  runTestFile,
  type SuiteBuilder,
} from './runner.js';

// Assertions
export {
  expect,
  asxrAssertions,
  AssertionError,
} from './assertions.js';

// Reporters
export {
  ConsoleReporter,
  JSONReporter,
  TAPReporter,
  createReporter,
} from './reporter.js';

// Convenience re-exports
import { TestRunner } from './runner.js';
import { ConsoleReporter } from './reporter.js';
import type { TestSuite, TestRunnerOptions, TestRunResult } from './types.js';

/**
 * Quick test runner with console output
 */
export async function runTestSuites(
  suites: TestSuite[],
  options?: Partial<TestRunnerOptions>
): Promise<TestRunResult> {
  const runner = new TestRunner({
    reporter: new ConsoleReporter({ colors: true, verbose: false }),
    ...options,
  });

  for (const suite of suites) {
    runner.addSuite(suite);
  }

  return runner.run();
}

/**
 * Create a test for parsing ASXR source
 */
export function parseTest(name: string, source: string) {
  return {
    name,
    source,
    tags: ['parse'],
  };
}

/**
 * Create a test for compiling ASXR source
 */
export function compileTest(name: string, source: string) {
  return {
    name,
    source,
    tags: ['compile'],
  };
}

/**
 * Create an error test (expected to fail)
 */
export function errorTest(name: string, source: string) {
  return {
    name,
    source,
    tags: ['error'],
  };
}
