#!/usr/bin/env node
/**
 * ATOMIC-DOM Interactive Setup CLI
 * Guides users through project configuration with mode selection
 */

import * as readline from 'readline';

// ============================================================================
// Logo & Branding
// ============================================================================

const LOGO = `
    ___   ________  __  _________
   /   | /_  __/ / / / / ____/ _ \\
  / /| |  / / / / / / / /   / /_\\ \\
 / ___ | / / / /_/ / / /___/ / \\ \\ \\
/_/  |_|/_/  \\____/  \\____/_/   \\_\\
    ____  ____  __  ___
   / __ \\/ __ \\/  |/  /
  / / / / / / / /|_/ /
 / /_/ / /_/ / /  / /
/_____/\\____/_/  /_/
`;

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  white: '\x1b[37m',
};

function colorize(text: string, color: keyof typeof COLORS): string {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function printLogo(): void {
  console.log(colorize(LOGO, 'cyan'));
  console.log(colorize('  Transactional DOM Updates', 'dim'));
  console.log(colorize('  v0.1.0', 'dim'));
  console.log();
}

// ============================================================================
// Configuration Types
// ============================================================================

export type ProjectionMode = 'dynamic' | 'static' | 'prebuilt';

export interface AtomicConfig {
  name: string;
  mode: ProjectionMode;
  purpose: 'app' | 'site' | 'component' | 'library';
  features: {
    typescript: boolean;
    plugins: string[];
    lsp: boolean;
    testing: boolean;
    splash: boolean;
  };
  advanced: {
    serialization: 'json' | 'cbor' | 'both';
    tinyDialect: boolean;
    cssAtomic: boolean;
    serverCalls: boolean;
  };
  output: {
    format: 'esm' | 'cjs' | 'iife' | 'all';
    declarations: boolean;
    sourcemaps: boolean;
    minify: boolean;
  };
}

const DEFAULT_CONFIG: AtomicConfig = {
  name: 'my-atomic-app',
  mode: 'dynamic',
  purpose: 'app',
  features: {
    typescript: true,
    plugins: ['control-flow'],
    lsp: true,
    testing: true,
    splash: false,
  },
  advanced: {
    serialization: 'json',
    tinyDialect: false,
    cssAtomic: false,
    serverCalls: false,
  },
  output: {
    format: 'esm',
    declarations: true,
    sourcemaps: true,
    minify: false,
  },
};

// ============================================================================
// Interactive Prompts
// ============================================================================

class SetupWizard {
  private rl: readline.Interface;
  private config: AtomicConfig;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.config = { ...DEFAULT_CONFIG };
  }

  private async prompt(question: string, defaultValue?: string): Promise<string> {
    const suffix = defaultValue ? ` ${colorize(`(${defaultValue})`, 'dim')}` : '';
    return new Promise((resolve) => {
      this.rl.question(`${colorize('?', 'green')} ${question}${suffix}: `, (answer) => {
        resolve(answer.trim() || defaultValue || '');
      });
    });
  }

  private async select<T extends string>(
    question: string,
    options: { value: T; label: string; description?: string }[],
    defaultIndex = 0
  ): Promise<T> {
    console.log(`\n${colorize('?', 'green')} ${question}\n`);

    options.forEach((opt, i) => {
      const marker = i === defaultIndex ? colorize('>', 'cyan') : ' ';
      const label = i === defaultIndex ? colorize(opt.label, 'cyan') : opt.label;
      const desc = opt.description ? colorize(` - ${opt.description}`, 'dim') : '';
      console.log(`  ${marker} ${i + 1}. ${label}${desc}`);
    });

    console.log();
    const answer = await this.prompt('Enter number', String(defaultIndex + 1));
    const index = parseInt(answer, 10) - 1;

    if (index >= 0 && index < options.length) {
      return options[index].value;
    }
    return options[defaultIndex].value;
  }

  private async confirm(question: string, defaultValue = true): Promise<boolean> {
    const hint = defaultValue ? 'Y/n' : 'y/N';
    const answer = await this.prompt(`${question} ${colorize(`[${hint}]`, 'dim')}`);

    if (!answer) return defaultValue;
    return answer.toLowerCase().startsWith('y');
  }

  private async multiSelect(
    question: string,
    options: { value: string; label: string; selected?: boolean }[]
  ): Promise<string[]> {
    console.log(`\n${colorize('?', 'green')} ${question} ${colorize('(comma-separated numbers)', 'dim')}\n`);

    options.forEach((opt, i) => {
      const marker = opt.selected ? colorize('[x]', 'green') : '[ ]';
      console.log(`  ${marker} ${i + 1}. ${opt.label}`);
    });

    console.log();
    const defaultSelected = options
      .map((o, i) => o.selected ? String(i + 1) : null)
      .filter(Boolean)
      .join(',');

    const answer = await this.prompt('Enter numbers', defaultSelected);
    const indices = answer.split(',').map(s => parseInt(s.trim(), 10) - 1);

    return options
      .filter((_, i) => indices.includes(i))
      .map(o => o.value);
  }

  // ============================================================================
  // Wizard Steps
  // ============================================================================

  private printSection(title: string): void {
    console.log();
    console.log(colorize('─'.repeat(50), 'dim'));
    console.log(colorize(`  ${title}`, 'bright'));
    console.log(colorize('─'.repeat(50), 'dim'));
    console.log();
  }

  async step1_basics(): Promise<void> {
    this.printSection('Project Basics');

    this.config.name = await this.prompt('Project name', 'my-atomic-app');

    this.config.purpose = await this.select('What are you building?', [
      { value: 'app', label: 'Web Application', description: 'Full interactive app' },
      { value: 'site', label: 'Website / CMS', description: 'Content-focused site' },
      { value: 'component', label: 'Component Library', description: 'Reusable UI components' },
      { value: 'library', label: 'Plugin / Library', description: 'ASXR extension' },
    ]);
  }

  async step2_mode(): Promise<void> {
    this.printSection('Projection Mode');

    console.log(colorize('  ATOMIC-DOM supports runtime-selectable projection modes:', 'dim'));
    console.log(colorize('  Structure (Atomic Blocks) stays the same; appearance adapts.', 'dim'));
    console.log();

    this.config.mode = await this.select('Select projection mode', [
      {
        value: 'dynamic',
        label: 'Dynamic',
        description: 'Stateful VDOM + diffing (gaming, realtime)'
      },
      {
        value: 'static',
        label: 'Static',
        description: 'Stateless projection (CMS, docs, dashboards)'
      },
      {
        value: 'prebuilt',
        label: 'Prebuilt',
        description: 'Compile-time output (static sites, zero runtime)'
      },
    ], this.config.purpose === 'site' ? 1 : 0);

    // Show mode details
    const modeDetails: Record<ProjectionMode, string[]> = {
      dynamic: [
        '  Highest update frequency',
        '  Virtual DOM diffing for minimal mutations',
        '  Best for: Games, realtime dashboards, interactive apps',
      ],
      static: [
        '  Recomputes projection on state change',
        '  No persistent VDOM tree',
        '  Best for: CMS, documentation, admin panels',
      ],
      prebuilt: [
        '  Zero runtime projection cost',
        '  All output generated at build time',
        '  Best for: Static sites, landing pages, blogs',
      ],
    };

    console.log();
    console.log(colorize(`  ${this.config.mode.toUpperCase()} mode selected:`, 'green'));
    modeDetails[this.config.mode].forEach(line => console.log(colorize(line, 'dim')));
  }

  async step3_features(): Promise<void> {
    this.printSection('Core Features');

    this.config.features.typescript = await this.confirm('Use TypeScript?', true);

    this.config.features.plugins = await this.multiSelect('Enable plugins', [
      { value: 'control-flow', label: 'Control Flow (@if, @for, @while)', selected: true },
      { value: 'jsx-syntax', label: 'JSX Syntax', selected: false },
      { value: 'vue-syntax', label: 'Vue Syntax', selected: false },
    ]);

    this.config.features.lsp = await this.confirm('Enable Language Server (LSP) support?', true);
    this.config.features.testing = await this.confirm('Include testing framework?', true);
    this.config.features.splash = await this.confirm('Add splash screen runtime?', false);
  }

  async step4_advanced(): Promise<boolean> {
    const showAdvanced = await this.confirm('Configure advanced options?', false);

    if (!showAdvanced) {
      return false;
    }

    this.printSection('Advanced Configuration');

    this.config.advanced.serialization = await this.select('Serialization format', [
      { value: 'json', label: 'JSON', description: 'Human-readable, debugging' },
      { value: 'cbor', label: 'CBOR', description: 'Binary, performance' },
      { value: 'both', label: 'Both', description: 'JSON dev, CBOR prod' },
    ]);

    this.config.advanced.tinyDialect = await this.confirm(
      'Enable Tiny dialect? (<2KB RAM for microcontrollers)',
      false
    );

    this.config.advanced.cssAtomic = await this.confirm(
      'Enable CSS atomic class generation?',
      false
    );

    this.config.advanced.serverCalls = await this.confirm(
      'Enable server call functions?',
      false
    );

    return true;
  }

  async step5_output(): Promise<void> {
    this.printSection('Output Configuration');

    this.config.output.format = await this.select('Output format', [
      { value: 'esm', label: 'ESM', description: 'ES Modules (recommended)' },
      { value: 'cjs', label: 'CommonJS', description: 'Node.js require()' },
      { value: 'iife', label: 'IIFE', description: 'Browser script tag' },
      { value: 'all', label: 'All formats', description: 'Universal package' },
    ]);

    if (this.config.features.typescript) {
      this.config.output.declarations = await this.confirm('Generate .d.ts declarations?', true);
    }

    this.config.output.sourcemaps = await this.confirm('Generate source maps?', true);
    this.config.output.minify = await this.confirm('Minify output?', false);
  }

  // ============================================================================
  // Summary & Generation
  // ============================================================================

  printSummary(): void {
    this.printSection('Configuration Summary');

    const { config } = this;

    console.log(`  ${colorize('Project:', 'bright')} ${config.name}`);
    console.log(`  ${colorize('Purpose:', 'bright')} ${config.purpose}`);
    console.log(`  ${colorize('Mode:', 'bright')} ${config.mode}`);
    console.log();

    console.log(`  ${colorize('Features:', 'bright')}`);
    console.log(`    TypeScript: ${config.features.typescript ? 'Yes' : 'No'}`);
    console.log(`    Plugins: ${config.features.plugins.join(', ') || 'None'}`);
    console.log(`    LSP: ${config.features.lsp ? 'Yes' : 'No'}`);
    console.log(`    Testing: ${config.features.testing ? 'Yes' : 'No'}`);
    console.log(`    Splash: ${config.features.splash ? 'Yes' : 'No'}`);
    console.log();

    console.log(`  ${colorize('Output:', 'bright')}`);
    console.log(`    Format: ${config.output.format}`);
    console.log(`    Declarations: ${config.output.declarations ? 'Yes' : 'No'}`);
    console.log(`    Source maps: ${config.output.sourcemaps ? 'Yes' : 'No'}`);
    console.log(`    Minify: ${config.output.minify ? 'Yes' : 'No'}`);
  }

  generateConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  generateAtomicrc(): string {
    const { config } = this;

    return `// atomic.config.js
// Generated by ATOMIC-DOM CLI

export default {
  name: "${config.name}",

  // Projection mode: 'dynamic' | 'static' | 'prebuilt'
  mode: "${config.mode}",

  // Plugins to load
  plugins: [
${config.features.plugins.map(p => `    "${p}",`).join('\n')}
  ],

  // Compiler options
  compiler: {
    typescript: ${config.features.typescript},
    declarations: ${config.output.declarations},
    sourcemaps: ${config.output.sourcemaps},
    minify: ${config.output.minify},
    format: "${config.output.format}",
  },

  // Runtime options
  runtime: {
    serialization: "${config.advanced.serialization}",
    tinyDialect: ${config.advanced.tinyDialect},
    cssAtomic: ${config.advanced.cssAtomic},
    serverCalls: ${config.advanced.serverCalls},
  },

  // Development options
  dev: {
    lsp: ${config.features.lsp},
    testing: ${config.features.testing},
    splash: ${config.features.splash},
  },
};
`;
  }

  // ============================================================================
  // Main Flow
  // ============================================================================

  async run(): Promise<AtomicConfig> {
    printLogo();

    console.log(colorize('  Welcome to ATOMIC-DOM!', 'bright'));
    console.log(colorize('  Let\'s set up your project.\n', 'dim'));

    try {
      await this.step1_basics();
      await this.step2_mode();
      await this.step3_features();
      await this.step4_advanced();
      await this.step5_output();

      this.printSummary();

      const proceed = await this.confirm('\nCreate project with these settings?', true);

      if (proceed) {
        console.log();
        console.log(colorize('  Creating atomic.config.js...', 'green'));
        console.log();
        console.log(colorize('─'.repeat(50), 'dim'));
        console.log(this.generateAtomicrc());
        console.log(colorize('─'.repeat(50), 'dim'));
        console.log();
        console.log(colorize('  Project configured successfully!', 'green'));
        console.log();
        console.log('  Next steps:');
        console.log(colorize('    1. npm install', 'cyan'));
        console.log(colorize('    2. Create your first .asxr file', 'cyan'));
        console.log(colorize('    3. npm run build', 'cyan'));
        console.log();
      } else {
        console.log(colorize('\n  Setup cancelled.\n', 'yellow'));
      }

      return this.config;
    } finally {
      this.rl.close();
    }
  }

  close(): void {
    this.rl.close();
  }
}

// ============================================================================
// Quick Setup (Non-interactive)
// ============================================================================

export function quickSetup(mode: ProjectionMode = 'dynamic'): AtomicConfig {
  return {
    ...DEFAULT_CONFIG,
    mode,
  };
}

// ============================================================================
// CLI Entry Points
// ============================================================================

export async function runSetup(): Promise<AtomicConfig> {
  const wizard = new SetupWizard();
  return wizard.run();
}

export function printHelp(): void {
  printLogo();

  console.log('Usage: atomic-dom [command] [options]\n');
  console.log('Commands:');
  console.log('  init              Interactive project setup');
  console.log('  init --quick      Quick setup with defaults');
  console.log('  build             Compile .asxr files');
  console.log('  dev               Start development server');
  console.log('  test              Run tests');
  console.log('  lsp               Start language server');
  console.log();
  console.log('Options:');
  console.log('  --mode <mode>     Set projection mode (dynamic|static|prebuilt)');
  console.log('  --config <file>   Use custom config file');
  console.log('  --help, -h        Show this help');
  console.log('  --version, -v     Show version');
  console.log();
  console.log('Projection Modes:');
  console.log('  dynamic           Stateful VDOM + diffing (default)');
  console.log('  static            Stateless projection');
  console.log('  prebuilt          Compile-time output');
  console.log();
}

export function printVersion(): void {
  console.log('atomic-dom v0.1.0');
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  // Check for --quick flag anywhere in args
  const isQuick = args.includes('--quick');
  const isInit = !command || command === 'init' || command === '--quick';

  if (isInit) {
    if (isQuick) {
      const modeIndex = args.indexOf('--mode');
      const modeArg = modeIndex !== -1 ? args[modeIndex + 1] : undefined;
      const mode = (modeArg as ProjectionMode) || 'dynamic';
      const config = quickSetup(mode);
      printLogo();
      console.log(colorize('  Quick setup complete!\n', 'green'));
      console.log(JSON.stringify(config, null, 2));
    } else {
      await runSetup();
    }
  } else if (command === '--help' || command === '-h') {
    printHelp();
  } else if (command === '--version' || command === '-v') {
    printVersion();
  } else {
    console.log(colorize(`Unknown command: ${command}`, 'red'));
    console.log('Run "atomic-dom --help" for usage.\n');
  }
}

// Run if executed directly
if (process.argv[1]?.includes('setup')) {
  main().catch(console.error);
}

export { SetupWizard, printLogo, COLORS, colorize };
