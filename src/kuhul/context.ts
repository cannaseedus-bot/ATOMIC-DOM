/**
 * K'UHUL Context Detection System
 * Automatic context detection from input for math, code, resume, and web
 */

import type { ContextType } from './microatomics.js';

// ============================================================================
// Context Indicators
// ============================================================================

export interface ContextIndicators {
  keywords: string[];
  patterns: RegExp[];
  weight: number;
}

export const CONTEXT_INDICATORS: Record<ContextType, ContextIndicators> = {
  math: {
    keywords: [
      'calculate', 'solve', 'equation', 'function', 'derivative', 'integral',
      'algebra', 'calculus', 'matrix', 'vector', 'probability', 'statistics',
      'formula', 'theorem', 'proof', 'sum', 'product', 'limit', 'series',
      'polynomial', 'factor', 'graph', 'plot', 'coordinate', 'geometry',
      'trigonometry', 'sin', 'cos', 'tan', 'logarithm', 'exponential',
      'differentiate', 'integrate', 'optimize', 'maximize', 'minimize',
      'eigenvalue', 'eigenvector', 'determinant', 'transpose', 'inverse',
      'regression', 'correlation', 'variance', 'standard deviation', 'mean',
      'median', 'mode', 'hypothesis', 'distribution', 'normal', 'binomial',
    ],
    patterns: [
      /\d+\s*[\+\-\*\/\^]\s*\d+/,           // Basic arithmetic
      /\d*x[\+\-\*\/\^\d]+/i,               // Algebraic expressions
      /f\s*\(\s*x\s*\)/,                    // Function notation
      /\bdy\/dx\b/i,                        // Derivatives
      /∫|∑|∏|√|π|∞/,                        // Math symbols
      /\bx\s*=\s*[-\d]/,                    // Equation solving
      /\[\s*\d.*\d\s*\]/,                   // Matrix notation
      /sin|cos|tan|log|ln|exp/i,            // Math functions
    ],
    weight: 1.5,
  },

  code: {
    keywords: [
      'code', 'program', 'function', 'class', 'algorithm', 'bug', 'debug',
      'variable', 'array', 'object', 'loop', 'condition', 'if', 'else',
      'for', 'while', 'switch', 'case', 'return', 'import', 'export',
      'async', 'await', 'promise', 'callback', 'closure', 'scope',
      'compile', 'runtime', 'error', 'exception', 'try', 'catch',
      'interface', 'type', 'generic', 'inheritance', 'polymorphism',
      'encapsulation', 'abstraction', 'design pattern', 'singleton',
      'factory', 'observer', 'decorator', 'adapter', 'strategy',
      'recursion', 'iteration', 'sort', 'search', 'tree', 'graph',
      'stack', 'queue', 'linked list', 'hash', 'binary', 'complexity',
      'python', 'javascript', 'typescript', 'java', 'rust', 'go', 'cpp',
      'api', 'rest', 'graphql', 'database', 'sql', 'query', 'orm',
      'git', 'commit', 'branch', 'merge', 'pull request', 'deploy',
      'npm', 'package', 'module', 'library', 'framework', 'sdk',
    ],
    patterns: [
      /function\s+\w+\s*\(/,                // Function declaration
      /const|let|var\s+\w+\s*=/,            // Variable declaration
      /class\s+\w+/,                        // Class declaration
      /import\s+.*from/,                    // Import statement
      /=>\s*\{?/,                           // Arrow function
      /\.\w+\(\)/,                          // Method call
      /\bif\s*\(|\bfor\s*\(|\bwhile\s*\(/,  // Control structures
      /\[\s*\w+\s*\]/,                      // Array access
      /\{\s*\w+:\s*/,                       // Object literal
      /`.*\$\{.*\}.*`/,                     // Template literal
      /\/\/.*|\/\*.*\*\//,                  // Comments
    ],
    weight: 1.3,
  },

  resume: {
    keywords: [
      'resume', 'cv', 'experience', 'skills', 'project', 'achievement',
      'job', 'career', 'professional', 'work', 'employment', 'position',
      'role', 'responsibility', 'accomplishment', 'qualification',
      'education', 'degree', 'certification', 'award', 'recognition',
      'team', 'leadership', 'management', 'collaboration', 'communication',
      'problem-solving', 'analytical', 'technical', 'soft skills',
      'years of experience', 'proficient', 'expert', 'skilled',
      'developed', 'implemented', 'managed', 'led', 'created', 'built',
      'improved', 'optimized', 'reduced', 'increased', 'delivered',
      'action words', 'bullet points', 'summary', 'objective',
      'cover letter', 'interview', 'hire', 'hiring', 'recruiter',
    ],
    patterns: [
      /\d+\+?\s*years?\s*(of\s+)?experience/i,  // Years of experience
      /\d+%\s*(increase|decrease|improvement)/i, // Metrics
      /\$\d+[KMB]?/i,                           // Dollar amounts
      /led\s+a?\s*team\s+of\s+\d+/i,            // Team leadership
      /responsible\s+for/i,                     // Responsibility
      /achieved|delivered|accomplished/i,       // Achievements
    ],
    weight: 1.4,
  },

  web: {
    keywords: [
      'website', 'html', 'css', 'javascript', 'page', 'layout', 'responsive',
      'frontend', 'backend', 'fullstack', 'web development', 'browser',
      'dom', 'element', 'div', 'span', 'button', 'form', 'input',
      'style', 'class', 'id', 'selector', 'flexbox', 'grid', 'animation',
      'react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'gatsby',
      'component', 'prop', 'state', 'hook', 'effect', 'context',
      'node', 'express', 'fastify', 'nest', 'server', 'route', 'endpoint',
      'fetch', 'axios', 'ajax', 'json', 'xml', 'http', 'https', 'cors',
      'seo', 'accessibility', 'a11y', 'wcag', 'aria', 'semantic',
      'mobile', 'tablet', 'desktop', 'viewport', 'media query',
      'webpack', 'vite', 'rollup', 'bundler', 'minify', 'transpile',
      'navbar', 'header', 'footer', 'sidebar', 'modal', 'dropdown',
      'carousel', 'slider', 'menu', 'navigation', 'card', 'hero',
    ],
    patterns: [
      /<\w+[^>]*>/,                          // HTML tags
      /\.\w+\s*\{/,                          // CSS class selector
      /#\w+\s*\{/,                           // CSS id selector
      /color\s*:\s*#?[\da-f]+/i,             // CSS color
      /px|em|rem|vh|vw|%/,                   // CSS units
      /display\s*:\s*(flex|grid|block)/i,   // CSS display
      /margin|padding|border/i,              // CSS box model
      /@media\s*\(/,                         // Media query
      /document\.(get|query|create)/,        // DOM methods
      /addEventListener/,                     // Event listener
    ],
    weight: 1.2,
  },

  general: {
    keywords: [],
    patterns: [],
    weight: 1.0,
  },

  atomic: {
    keywords: [
      'atomic', 'object server', 'object.json', 'descriptor', 'payload',
      'projection', 'invariant', 'authority', 'escalation', 'capability',
      'atomic blocks', 'header', 'body', 'sidebars', 'footer', 'template',
      'micronaut', 'perception', 'layout', 'theme', 'motion', 'density',
      'visibility', 'slot', 'placeholder', 'kuhul', 'toml', 'cluster',
      'object://', 'hash', 'sha256', 'canonical', 'immutable', 'inert',
      'no_execution', 'projection_only', 'block', 'structural', 'semantic',
    ],
    patterns: [
      /object:\/\//,                            // Object URI
      /sha256:[a-f0-9]+/i,                      // Hash reference
      /@micronaut\s+\w+/,                       // Micronaut declaration
      /<header>|<body>|<sidebars>|<footer>/,   // Atomic blocks
      /\{\{[\w.]+\}\}/,                         // Slot syntax
      /"authority"\s*:\s*"(none|read|write|execute)"/,  // Authority declaration
      /"invariants"\s*:\s*\[/,                  // Invariants array
      /"projections"\s*:\s*\{/,                 // Projections object
    ],
    weight: 1.4,
  },
};

// ============================================================================
// Context Detection
// ============================================================================

export interface ContextScore {
  type: ContextType;
  score: number;
  matches: string[];
  confidence: number;
}

/**
 * Calculate context score for input text
 */
export function calculateContextScore(input: string, contextType: ContextType): ContextScore {
  const indicators = CONTEXT_INDICATORS[contextType];
  const lowerInput = input.toLowerCase();
  const matches: string[] = [];
  let score = 0;

  // Check keywords
  for (const keyword of indicators.keywords) {
    if (lowerInput.includes(keyword.toLowerCase())) {
      score += 1;
      matches.push(keyword);
    }
  }

  // Check patterns
  for (const pattern of indicators.patterns) {
    if (pattern.test(input)) {
      score += 2; // Patterns worth more
      matches.push(pattern.source);
    }
  }

  // Apply weight
  score *= indicators.weight;

  // Calculate confidence (0-1)
  const maxPossibleScore = (indicators.keywords.length + indicators.patterns.length * 2) * indicators.weight;
  const confidence = maxPossibleScore > 0 ? Math.min(score / maxPossibleScore, 1) : 0;

  return {
    type: contextType,
    score,
    matches,
    confidence,
  };
}

/**
 * Detect context type from input
 */
export function detectContext(input: string, hint?: ContextType): ContextType {
  // If hint provided and valid, use it
  if (hint && hint !== 'general') {
    return hint;
  }

  const contextTypes: ContextType[] = ['math', 'code', 'resume', 'web'];
  let bestContext: ContextType = 'general';
  let bestScore = 0;

  for (const contextType of contextTypes) {
    const result = calculateContextScore(input, contextType);
    if (result.score > bestScore) {
      bestScore = result.score;
      bestContext = contextType;
    }
  }

  // Require minimum score to avoid false positives
  return bestScore >= 2 ? bestContext : 'general';
}

/**
 * Get all context scores for input
 */
export function getAllContextScores(input: string): ContextScore[] {
  const contextTypes: ContextType[] = ['math', 'code', 'resume', 'web', 'general'];
  return contextTypes
    .map(type => calculateContextScore(input, type))
    .sort((a, b) => b.score - a.score);
}

/**
 * Detect multiple contexts (input may span multiple areas)
 */
export function detectMultipleContexts(input: string, threshold: number = 2): ContextType[] {
  const scores = getAllContextScores(input);
  return scores
    .filter(s => s.score >= threshold && s.type !== 'general')
    .map(s => s.type);
}

// ============================================================================
// Context Registries
// ============================================================================

export const MATH_CONTEXT_REGISTRY = {
  algebra: {
    topics: ['equations', 'polynomials', 'matrices', 'vectors'],
    context: 'symbolic manipulation, problem solving',
  },
  calculus: {
    topics: ['derivatives', 'integrals', 'limits', 'series'],
    context: 'rates of change, optimization, area calculation',
  },
  statistics: {
    topics: ['probability', 'distributions', 'hypothesis testing', 'regression'],
    context: 'data analysis, inference, modeling',
  },
  discrete_math: {
    topics: ['graphs', 'logic', 'set theory', 'combinatorics'],
    context: 'computer science foundations, algorithm design',
  },
  linear_algebra: {
    topics: ['matrices', 'vector spaces', 'eigenvalues', 'transformations'],
    context: 'machine learning, computer graphics, physics',
  },
};

export const PROGRAMMING_CONTEXT_REGISTRY = {
  languages: {
    frontend: ['javascript', 'typescript', 'html', 'css'],
    backend: ['python', 'java', 'go', 'rust', 'node.js'],
    systems: ['c', 'c++', 'assembly'],
    functional: ['haskell', 'scala', 'elixir'],
  },
  paradigms: {
    oop: ['classes', 'inheritance', 'polymorphism', 'encapsulation'],
    functional: ['immutability', 'higher_order_functions', 'recursion'],
    procedural: ['procedures', 'structured_programming'],
    declarative: ['sql', 'html', 'css'],
  },
  patterns: {
    creational: ['factory', 'singleton', 'builder'],
    structural: ['adapter', 'composite', 'decorator'],
    behavioral: ['observer', 'strategy', 'command'],
    architectural: ['mvc', 'mvvm', 'microservices'],
  },
};

// ============================================================================
// Context Description
// ============================================================================

export function getContextDescription(type: ContextType): string {
  const descriptions: Record<ContextType, string> = {
    math: 'Mathematical problem solving, equations, and calculations',
    code: 'Programming, algorithms, and software development',
    resume: 'Professional experience, achievements, and career development',
    web: 'Web development, HTML/CSS/JavaScript, and frontend design',
    atomic: 'Atomic Framework, Object Server, blocks, micronauts, and projections',
    general: 'General purpose assistance',
  };
  return descriptions[type];
}

export function getContextEmoji(type: ContextType): string {
  const emojis: Record<ContextType, string> = {
    math: '🧮',
    code: '💻',
    resume: '📄',
    web: '🌐',
    atomic: '⚛️',
    general: '💬',
  };
  return emojis[type];
}
