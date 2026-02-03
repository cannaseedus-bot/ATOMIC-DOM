/**
 * K'UHUL Inference Engine
 * Prompt templates and context-aware inference
 */

import type { ContextType, MicroAtomicContext } from './microatomics.js';
import { orchestrator } from './microatomics.js';
import { detectContext, getContextEmoji, getContextDescription } from './context.js';
import { extractActionWords, suggestStrongerWords, type ActionWord } from './action-words.js';

// ============================================================================
// Prompt Templates
// ============================================================================

export interface PromptTemplate {
  id: string;
  context: ContextType;
  template: string;
  variables: string[];
}

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  math_problem: {
    id: 'math_problem',
    context: 'math',
    template: `Context: Mathematical problem solving
User Input: {input}

Provide:
1. Step-by-step solution
2. Relevant formulas/theorems
3. Alternative approaches
4. Real-world applications

Format as markdown with LaTeX for equations.`,
    variables: ['input'],
  },

  coding_explanation: {
    id: 'coding_explanation',
    context: 'code',
    template: `Context: Programming concept explanation
User Input: {input}

Explain:
1. Core concept clearly
2. Code examples in relevant languages
3. Common use cases
4. Best practices
5. Related concepts

Format with code blocks and bullet points.`,
    variables: ['input'],
  },

  resume_help: {
    id: 'resume_help',
    context: 'resume',
    template: `Context: Resume/CV improvement for developers
User Input: {input}

Provide:
1. Strong action words from the registry
2. Quantifiable achievements
3. Relevant skills section
4. Project descriptions
5. Industry-specific keywords

Format with sections and bullet points.`,
    variables: ['input'],
  },

  code_generation: {
    id: 'code_generation',
    context: 'code',
    template: `Context: Code generation/snippet creation
User Input: {input}

Generate:
1. Complete, runnable code
2. Comments explaining logic
3. Error handling
4. Test cases/examples
5. Performance considerations

Format with appropriate code blocks.`,
    variables: ['input'],
  },

  website_editing: {
    id: 'website_editing',
    context: 'web',
    template: `Context: Website development/editing
User Input: {input}

Provide:
1. HTML/CSS/JS code
2. Responsive design considerations
3. Accessibility features
4. Browser compatibility
5. Performance optimizations

Format with code blocks and explanations.`,
    variables: ['input'],
  },

  general_query: {
    id: 'general_query',
    context: 'general',
    template: `User Input: {input}

Provide a helpful, clear response.`,
    variables: ['input'],
  },
};

// ============================================================================
// Inference Response
// ============================================================================

export interface InferenceResponse {
  content: string;
  context: ContextType;
  microatomicsUsed: string[];
  actionWordsFound: ActionWord[];
  suggestedWords: ActionWord[];
  timestamp: number;
  metadata: Record<string, unknown>;
}

// ============================================================================
// Inference Engine
// ============================================================================

export class InferenceEngine {
  private templates: Map<string, PromptTemplate>;

  constructor() {
    this.templates = new Map();
    for (const [key, template] of Object.entries(PROMPT_TEMPLATES)) {
      this.templates.set(key, template);
    }
  }

  /**
   * Get template for context type
   */
  getTemplate(context: ContextType): PromptTemplate {
    const templateMap: Record<ContextType, string> = {
      math: 'math_problem',
      code: 'coding_explanation',
      resume: 'resume_help',
      web: 'website_editing',
      atomic: 'atomic_framework',
      general: 'general_query',
    };

    const templateId = templateMap[context];
    return this.templates.get(templateId) || PROMPT_TEMPLATES.general_query;
  }

  /**
   * Frame input with context
   */
  frameInput(input: string, context: ContextType): string {
    const template = this.getTemplate(context);
    return template.template.replace('{input}', input);
  }

  /**
   * Create inference context
   */
  createContext(input: string, hint?: ContextType): MicroAtomicContext {
    const contextType = detectContext(input, hint);
    return orchestrator.createContext(input, contextType);
  }

  /**
   * Process input and generate response structure
   */
  process(input: string, hint?: ContextType): InferenceResponse {
    const context = this.createContext(input, hint);
    const framedInput = this.frameInput(input, context.type);
    const actionWordsFound = extractActionWords(input);
    const suggestedWords = suggestStrongerWords(input);
    const selectedMicroatomics = orchestrator.selectForContext(context.type);

    return {
      content: framedInput,
      context: context.type,
      microatomicsUsed: selectedMicroatomics.map(ma => ma.id),
      actionWordsFound,
      suggestedWords,
      timestamp: Date.now(),
      metadata: {
        originalInput: input,
        hint,
        contextConfidence: context.type !== 'general' ? 'detected' : 'fallback',
      },
    };
  }

  /**
   * Format response for output
   */
  formatResponse(response: InferenceResponse): string {
    const emoji = getContextEmoji(response.context);
    const description = getContextDescription(response.context);

    let output = `## ${emoji} ${description}\n\n`;
    output += response.content + '\n\n';

    output += `---\n`;
    output += `**Context:** ${response.context}\n`;
    output += `**MicroAtomics Used:** ${response.microatomicsUsed.join(', ')}\n`;

    if (response.actionWordsFound.length > 0) {
      output += `\n**Action Words Found:**\n`;
      for (const aw of response.actionWordsFound) {
        output += `- **${aw.word}**: ${aw.meaning}\n`;
      }
    }

    if (response.suggestedWords.length > 0) {
      output += `\n**Suggested Stronger Words:**\n`;
      for (const aw of response.suggestedWords) {
        output += `- **${aw.word}**: ${aw.example}\n`;
      }
    }

    return output;
  }

  /**
   * Format for CLI output
   */
  formatForCLI(response: InferenceResponse): string {
    const lines: string[] = [];

    lines.push('');
    lines.push(`  Context: ${response.context.toUpperCase()}`);
    lines.push(`  MicroAtomics: ${response.microatomicsUsed.join(', ')}`);
    lines.push('');
    lines.push('─'.repeat(50));
    lines.push('');
    lines.push(response.content);
    lines.push('');

    if (response.actionWordsFound.length > 0) {
      lines.push('─'.repeat(50));
      lines.push('  Action Words Found:');
      for (const aw of response.actionWordsFound) {
        lines.push(`    • ${aw.word} - ${aw.meaning}`);
      }
    }

    if (response.suggestedWords.length > 0) {
      lines.push('');
      lines.push('  Suggested Stronger Words:');
      for (const aw of response.suggestedWords.slice(0, 3)) {
        lines.push(`    → ${aw.word}: "${aw.example}"`);
      }
    }

    lines.push('');

    return lines.join('\n');
  }
}

// ============================================================================
// CLI Command Handler
// ============================================================================

export type CLICommand = 'math' | 'code' | 'resume' | 'web' | 'help' | 'status';

export interface CLIResult {
  success: boolean;
  output: string;
  context?: ContextType;
}

export function handleCLICommand(command: CLICommand, args: string[]): CLIResult {
  const engine = new InferenceEngine();
  const input = args.join(' ');

  switch (command) {
    case 'math': {
      const response = engine.process(input, 'math');
      return {
        success: true,
        output: engine.formatForCLI(response),
        context: 'math',
      };
    }

    case 'code': {
      const response = engine.process(input, 'code');
      return {
        success: true,
        output: engine.formatForCLI(response),
        context: 'code',
      };
    }

    case 'resume': {
      const response = engine.process(input, 'resume');
      return {
        success: true,
        output: engine.formatForCLI(response),
        context: 'resume',
      };
    }

    case 'web': {
      const response = engine.process(input, 'web');
      return {
        success: true,
        output: engine.formatForCLI(response),
        context: 'web',
      };
    }

    case 'status': {
      const microatomics = orchestrator.getActive();
      let output = '\n  K\'UHUL MicroAtomics Status\n';
      output += '─'.repeat(50) + '\n\n';
      output += `  Active MicroAtomics: ${microatomics.length}\n\n`;

      for (const ma of microatomics) {
        output += `  • ${ma.id.toUpperCase()}\n`;
        output += `    Role: ${ma.role}\n`;
        output += `    Domains: ${ma.domains.join(', ')}\n\n`;
      }

      return { success: true, output };
    }

    case 'help':
    default: {
      const output = `
  K'UHUL MicroAtomics CLI
  ═══════════════════════

  Commands:
    math [query]    - Mathematical problem solving
    code [query]    - Programming/coding questions
    resume [query]  - Resume/experience help
    web [query]     - Website development/editing
    status          - Show MicroAtomics status
    help            - This help message

  Focus Areas:
    • Mathematics (algebra, calculus, statistics)
    • Programming (languages, algorithms, patterns)
    • Code Generation (snippets, templates, refactoring)
    • Website Editing (HTML, CSS, JavaScript)
    • Resume Building (action words, achievements)

  Examples:
    math Explain the chain rule in calculus
    code How to implement quicksort in Python?
    resume Describe my API development experience
    web Create a responsive navbar

  Powered by K'UHUL MicroAtomics
`;
      return { success: true, output };
    }
  }
}

// ============================================================================
// Default Engine Instance
// ============================================================================

export const inferenceEngine = new InferenceEngine();
