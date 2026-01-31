#!/usr/bin/env node
/**
 * ASXR Compiler CLI
 * Compiles .asxr files to JavaScript
 */

import { readFileSync, writeFileSync, existsSync, watch, readdirSync, statSync } from 'fs';
import { parse, Parser } from './parser/parser.js';
import { generate, CodeGenOptions } from './compiler/codegen.js';
import { validate, formatDiagnostics } from './validator/index.js';
import { TestRunner, describe, ConsoleReporter, JSONReporter, TAPReporter } from './testing/index.js';
import type { TestReporter } from './testing/types.js';

interface CLIOptions {
  command: 'compile' | 'test';
  input: string;
  output?: string;
  format: 'esm' | 'cjs';
  minify: boolean;
  watch: boolean;
  check: boolean;
  strict: boolean;
  help: boolean;
  // Test options
  reporter: 'console' | 'json' | 'tap';
  filter?: string;
  updateSnapshots: boolean;
  verbose: boolean;
}

function printHelp(): void {
  console.log(`
ASXR CLI - Compile and test .asxr files

Usage: asxr [command] [options] <input>

Commands:
  compile (default)      Compile .asxr files to JavaScript
  test                   Run tests on .asxr files

Compile Options:
  -o, --output <file>    Output file (default: <input>.js)
  -f, --format <type>    Output format: esm | cjs (default: esm)
  -m, --minify           Minify output
  -c, --check            Validate only, don't compile
  -s, --strict           Strict mode (treat warnings as errors)
  -w, --watch            Watch for changes

Test Options:
  --reporter <type>      Reporter: console | json | tap (default: console)
  --filter <pattern>     Filter tests by name pattern
  --update-snapshots     Update snapshots instead of comparing
  --verbose              Show detailed output

General:
  -h, --help             Show this help message

Examples:
  asxr app.asxr                    # Compile to app.js
  asxr app.asxr -o dist/app.js     # Compile to specific output
  asxr app.asxr -c                 # Check for errors only
  asxr test tests/                 # Run tests in directory
  asxr test app.test.asxr          # Run single test file
  asxr test --reporter json        # Output JSON results
`);
}

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {
    command: 'compile',
    input: '',
    format: 'esm',
    minify: false,
    watch: false,
    check: false,
    strict: false,
    help: false,
    reporter: 'console',
    updateSnapshots: false,
    verbose: false,
  };

  let i = 0;

  // Check for command
  if (args[0] && !args[0].startsWith('-')) {
    if (args[0] === 'test') {
      options.command = 'test';
      i = 1;
    } else if (args[0] === 'compile') {
      options.command = 'compile';
      i = 1;
    }
  }

  for (; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '-o' || arg === '--output') {
      options.output = args[++i];
    } else if (arg === '-f' || arg === '--format') {
      const format = args[++i];
      if (format === 'esm' || format === 'cjs') {
        options.format = format;
      } else {
        console.error(`Invalid format: ${format}. Use 'esm' or 'cjs'.`);
      }
    } else if (arg === '-m' || arg === '--minify') {
      options.minify = true;
    } else if (arg === '-c' || arg === '--check') {
      options.check = true;
    } else if (arg === '-s' || arg === '--strict') {
      options.strict = true;
    } else if (arg === '-w' || arg === '--watch') {
      options.watch = true;
    } else if (arg === '--reporter') {
      const reporter = args[++i];
      if (reporter === 'console' || reporter === 'json' || reporter === 'tap') {
        options.reporter = reporter;
      } else {
        console.error(`Invalid reporter: ${reporter}. Use 'console', 'json', or 'tap'.`);
      }
    } else if (arg === '--filter') {
      options.filter = args[++i];
    } else if (arg === '--update-snapshots' || arg === '-u') {
      options.updateSnapshots = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (!arg.startsWith('-')) {
      options.input = arg;
    }
  }

  return options;
}

function compile(inputPath: string, options: CLIOptions): boolean {
  // Read input
  if (!existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`);
    return false;
  }

  const source = readFileSync(inputPath, 'utf-8');

  // Parse
  const parser = new Parser(source);
  const ast = parser.parse();
  const parseErrors = parser.getErrors();

  if (parseErrors.length > 0) {
    console.error(`Parse errors in ${inputPath}:`);
    for (const error of parseErrors) {
      console.error(`  Line ${error.position.line}: ${error.message}`);
    }
    return false;
  }

  // Validate
  const validationResult = validate(ast, {
    schemas: true,
    laws: true,
    checkReferences: true,
    warnUnused: options.strict,
  });

  if (validationResult.diagnostics.length > 0) {
    const formatted = formatDiagnostics(validationResult.diagnostics);
    console.log(`\nValidation (${inputPath}):`);
    for (const line of formatted) {
      console.log(`  ${line}`);
    }
    console.log(`\n  ${validationResult.stats.errors} error(s), ${validationResult.stats.warnings} warning(s)`);
  }

  // In check mode, just validate
  if (options.check) {
    if (validationResult.valid) {
      console.log(`✓ ${inputPath} is valid`);
      return true;
    } else {
      return false;
    }
  }

  // In strict mode, treat warnings as errors
  if (options.strict && validationResult.stats.warnings > 0) {
    console.error('Strict mode: warnings treated as errors');
    return false;
  }

  // Don't generate if there are errors
  if (!validationResult.valid) {
    return false;
  }

  // Generate
  const codegenOptions: Partial<CodeGenOptions> = {
    format: options.format,
    minify: options.minify,
  };

  const output = generate(ast, codegenOptions);

  // Write output
  const outputPath = options.output || inputPath.replace(/\.asxr$/, '.js');
  writeFileSync(outputPath, output, 'utf-8');

  console.log(`Compiled: ${inputPath} -> ${outputPath}`);

  // Generate .d.ts if ESM
  if (options.format === 'esm') {
    const dtsPath = outputPath.replace(/\.js$/, '.d.ts');
    const dts = generateTypeDeclarations(ast);
    writeFileSync(dtsPath, dts, 'utf-8');
    console.log(`Types: ${dtsPath}`);
  }

  return true;
}

function generateTypeDeclarations(ast: ReturnType<typeof parse>): string {
  const lines: string[] = [
    '// Generated type declarations for ASXR',
    "import type { Block, DomNode } from 'atomic-dom/runtime';",
    '',
  ];

  for (const item of ast.body) {
    if (item.type === 'AtomicBlock' && 'id' in item && item.id) {
      lines.push(`export declare const ${toVarName(item.id)}: Block;`);
    } else if (item.type === 'DomBlock' && 'id' in item && item.id) {
      lines.push(`export declare const ${toVarName(item.id)}: DomNode;`);
    }
  }

  lines.push('');
  lines.push('export declare const blocks: Record<string, Block>;');

  return lines.join('\n');
}

function toVarName(name: string): string {
  return name
    .replace(/^#/, '')
    .replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Run tests on ASXR files
 */
async function runTestCommand(options: CLIOptions): Promise<boolean> {
  // Create reporter
  let reporter: TestReporter;
  switch (options.reporter) {
    case 'json':
      reporter = new JSONReporter();
      break;
    case 'tap':
      reporter = new TAPReporter();
      break;
    default:
      reporter = new ConsoleReporter({ colors: true, verbose: options.verbose });
  }

  const runner = new TestRunner({
    reporter,
    updateSnapshots: options.updateSnapshots,
    filter: options.filter ? new RegExp(options.filter) : undefined,
  });

  // Find test files
  const testFiles = findTestFiles(options.input);

  if (testFiles.length === 0) {
    console.error('No test files found');
    return false;
  }

  // Create test suites from files
  for (const file of testFiles) {
    const source = readFileSync(file, 'utf-8');
    const suite = describe(file, (s) => {
      s.test('parses and compiles', source);
    });
    runner.addSuite(suite);
  }

  // Run tests
  const result = await runner.run();

  return result.totalFailed === 0;
}

/**
 * Find test files in a path
 */
function findTestFiles(path: string): string[] {
  if (!existsSync(path)) {
    console.error(`Path not found: ${path}`);
    return [];
  }

  const stat = statSync(path);

  if (stat.isFile()) {
    return [path];
  }

  if (stat.isDirectory()) {
    const files: string[] = [];
    const entries = readdirSync(path, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = `${path}/${entry.name}`;
      if (entry.isDirectory()) {
        files.push(...findTestFiles(fullPath));
      } else if (entry.name.endsWith('.asxr') || entry.name.endsWith('.test.asxr')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  return [];
}

// Main
const args = process.argv.slice(2);
const options = parseArgs(args);

if (options.help || !options.input) {
  printHelp();
} else if (options.command === 'test') {
  runTestCommand(options).then((success) => {
    if (!success) {
      process.exit(1);
    }
  });
} else if (options.watch) {
  console.log(`Watching ${options.input}...`);
  // Initial compile
  compile(options.input, options);

  // Watch for changes
  watch(options.input, (eventType: string) => {
    if (eventType === 'change') {
      console.log(`\nFile changed, recompiling...`);
      compile(options.input, options);
    }
  });
} else {
  const success = compile(options.input, options);
  if (!success) {
    process.exit(1);
  }
}
