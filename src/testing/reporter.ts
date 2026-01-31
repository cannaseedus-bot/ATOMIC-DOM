/**
 * ASXR Test Reporter
 * Console output formatting for test results
 */

import type {
  TestReporter,
  TestSuite,
  TestCase,
  TestResult,
  SuiteResult,
  TestRunResult,
} from './types.js';

/**
 * ANSI color codes
 */
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
};

/**
 * Console test reporter
 */
export class ConsoleReporter implements TestReporter {
  private useColors: boolean;
  private verbose: boolean;

  constructor(options: { colors?: boolean; verbose?: boolean } = {}) {
    this.useColors = options.colors ?? true;
    this.verbose = options.verbose ?? false;
  }

  private color(text: string, ...codes: string[]): string {
    if (!this.useColors) return text;
    return codes.join('') + text + colors.reset;
  }

  onRunStart(): void {
    console.log();
    console.log(this.color('Running ASXR Tests...', colors.bold, colors.cyan));
    console.log();
  }

  onSuiteStart(suite: TestSuite): void {
    console.log(this.color(`  ${suite.name}`, colors.bold));
  }

  onSuiteEnd(_result: SuiteResult): void {
    console.log();
  }

  onTestStart(_test: TestCase): void {
    // Optional: show test starting
  }

  onTestEnd(result: TestResult): void {
    const icon = this.getStatusIcon(result.status);
    const statusColor = this.getStatusColor(result.status);
    const duration = this.formatDuration(result.duration);

    console.log(
      `    ${icon} ${this.color(result.name, statusColor)} ${this.color(duration, colors.gray)}`
    );

    if (result.status === 'failed' && result.error) {
      console.log(this.color(`      Error: ${result.error.message}`, colors.red));

      if (this.verbose && result.error.stack) {
        const stackLines = result.error.stack.split('\n').slice(1, 4);
        for (const line of stackLines) {
          console.log(this.color(`      ${line.trim()}`, colors.gray));
        }
      }
    }

    if (this.verbose && result.assertions.length > 0) {
      for (const assertion of result.assertions) {
        const assertIcon = assertion.passed ? '✓' : '✗';
        const assertColor = assertion.passed ? colors.green : colors.red;
        console.log(
          this.color(`      ${assertIcon} ${assertion.assertion}`, assertColor)
        );
      }
    }
  }

  onRunEnd(result: TestRunResult): void {
    console.log(this.color('═'.repeat(50), colors.gray));
    console.log();

    // Summary
    const total = result.totalPassed + result.totalFailed + result.totalSkipped;

    if (result.totalFailed > 0) {
      console.log(
        this.color(
          `  ${result.totalFailed} failed`,
          colors.bold,
          colors.red
        ) +
          this.color(`, ${result.totalPassed} passed`, colors.green) +
          (result.totalSkipped > 0
            ? this.color(`, ${result.totalSkipped} skipped`, colors.yellow)
            : '') +
          this.color(` (${total} total)`, colors.gray)
      );
    } else if (result.totalPassed > 0) {
      console.log(
        this.color(
          `  All ${result.totalPassed} tests passed!`,
          colors.bold,
          colors.green
        ) +
          (result.totalSkipped > 0
            ? this.color(` (${result.totalSkipped} skipped)`, colors.yellow)
            : '')
      );
    } else {
      console.log(this.color('  No tests found', colors.yellow));
    }

    // Snapshots
    if (result.snapshotsNew > 0 || result.snapshotsUpdated > 0) {
      console.log();
      if (result.snapshotsNew > 0) {
        console.log(
          this.color(`  ${result.snapshotsNew} new snapshots written`, colors.cyan)
        );
      }
      if (result.snapshotsUpdated > 0) {
        console.log(
          this.color(`  ${result.snapshotsUpdated} snapshots updated`, colors.yellow)
        );
      }
    }

    // Duration
    console.log();
    console.log(
      this.color(
        `  Duration: ${this.formatDuration(result.totalDuration)}`,
        colors.gray
      )
    );
    console.log();
  }

  private getStatusIcon(status: TestResult['status']): string {
    const icons: Record<TestResult['status'], string> = {
      passed: this.color('✓', colors.green),
      failed: this.color('✗', colors.red),
      skipped: this.color('○', colors.yellow),
      timeout: this.color('⏱', colors.red),
    };
    return icons[status];
  }

  private getStatusColor(status: TestResult['status']): string {
    const statusColors: Record<TestResult['status'], string> = {
      passed: colors.green,
      failed: colors.red,
      skipped: colors.yellow,
      timeout: colors.red,
    };
    return statusColors[status];
  }

  private formatDuration(ms: number): string {
    if (ms < 1) return '<1ms';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

/**
 * JSON test reporter (for CI/CD)
 */
export class JSONReporter implements TestReporter {
  private results: TestRunResult | null = null;

  onRunStart(): void {}
  onSuiteStart(_suite: TestSuite): void {}
  onSuiteEnd(_result: SuiteResult): void {}
  onTestStart(_test: TestCase): void {}
  onTestEnd(_result: TestResult): void {}

  onRunEnd(result: TestRunResult): void {
    this.results = result;
    console.log(JSON.stringify(result, null, 2));
  }

  getResults(): TestRunResult | null {
    return this.results;
  }
}

/**
 * TAP (Test Anything Protocol) reporter
 */
export class TAPReporter implements TestReporter {
  private testNumber = 0;
  private total = 0;

  onRunStart(): void {
    this.testNumber = 0;
  }

  onSuiteStart(suite: TestSuite): void {
    this.total += suite.tests.length;
    console.log(`# ${suite.name}`);
  }

  onSuiteEnd(_result: SuiteResult): void {}

  onTestStart(_test: TestCase): void {}

  onTestEnd(result: TestResult): void {
    this.testNumber++;

    if (result.status === 'passed') {
      console.log(`ok ${this.testNumber} - ${result.name}`);
    } else if (result.status === 'skipped') {
      console.log(`ok ${this.testNumber} - ${result.name} # SKIP`);
    } else {
      console.log(`not ok ${this.testNumber} - ${result.name}`);
      if (result.error) {
        console.log(`  ---`);
        console.log(`  message: ${result.error.message}`);
        console.log(`  ---`);
      }
    }
  }

  onRunEnd(result: TestRunResult): void {
    console.log(`1..${this.total}`);
    console.log(`# tests ${this.total}`);
    console.log(`# pass ${result.totalPassed}`);
    console.log(`# fail ${result.totalFailed}`);
  }
}

/**
 * Create a reporter by name
 */
export function createReporter(
  name: 'console' | 'json' | 'tap',
  options?: { colors?: boolean; verbose?: boolean }
): TestReporter {
  switch (name) {
    case 'json':
      return new JSONReporter();
    case 'tap':
      return new TAPReporter();
    case 'console':
    default:
      return new ConsoleReporter(options);
  }
}
