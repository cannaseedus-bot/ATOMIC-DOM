#!/usr/bin/env node
/**
 * ASXR Compiler CLI
 * Compiles .asxr files to JavaScript
 */

import { readFileSync, writeFileSync, existsSync, watch } from 'fs';
import { parse, Parser } from './parser/parser.js';
import { generate, CodeGenOptions } from './compiler/codegen.js';
import { validate, formatDiagnostics } from './validator/index.js';

interface CLIOptions {
  input: string;
  output?: string;
  format: 'esm' | 'cjs';
  minify: boolean;
  watch: boolean;
  check: boolean;
  strict: boolean;
  help: boolean;
}

function printHelp(): void {
  console.log(`
ASXR Compiler - Compile .asxr files to JavaScript

Usage: asxr [options] <input.asxr>

Options:
  -o, --output <file>    Output file (default: <input>.js)
  -f, --format <type>    Output format: esm | cjs (default: esm)
  -m, --minify           Minify output
  -c, --check            Validate only, don't compile
  -s, --strict           Strict mode (treat warnings as errors)
  -w, --watch            Watch for changes
  -h, --help             Show this help message

Examples:
  asxr app.asxr                    # Compile to app.js
  asxr app.asxr -o dist/app.js     # Compile to specific output
  asxr app.asxr -f cjs             # Output CommonJS format
  asxr app.asxr -c                 # Check for errors only
  asxr app.asxr -w                 # Watch mode
`);
}

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {
    input: '',
    format: 'esm',
    minify: false,
    watch: false,
    check: false,
    strict: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
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

// Main
const args = process.argv.slice(2);
const options = parseArgs(args);

if (options.help || !options.input) {
  printHelp();
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
