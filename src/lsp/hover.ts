/**
 * ASXR Hover Provider
 * Provides hover information for symbols
 */

import type { Document } from './documents.js';
import type { Position, Hover, Range } from './types.js';

/**
 * Documentation for ASXR keywords
 */
const KEYWORD_DOCS: Record<string, { title: string; description: string; example?: string }> = {
  '@atomic': {
    title: 'Atomic Block',
    description: 'Defines an atomic unit of DOM operations that are batched together for optimal performance.',
    example: `@atomic[myBlock] {
  @dom div { prop: class = "container"; }
}`,
  },
  '@dom': {
    title: 'DOM Block',
    description: 'Defines a DOM element with properties, styles, and children.',
    example: `@dom button {
  prop: class = "btn";
  on: click => handleClick();
  children: "Click me"
}`,
  },
  '@component': {
    title: 'Component Definition',
    description: 'Defines a reusable component with props and internal state.',
    example: `@component[Counter] {
  props: { initial: 0 }
  state: { count: {{props.initial}} }
}`,
  },
  '@state': {
    title: 'State Definition',
    description: 'Defines reactive state that triggers updates when changed.',
    example: `@state[appState] {
  user: null,
  items: [],
  loading: false
}`,
  },
  '@reactor': {
    title: 'Reactor Block',
    description: 'Defines reactive behavior that responds to state changes.',
    example: `@reactor {
  when: {{items.length}} > 0,
  then: {
    @dom .list { prop: display = "block"; }
  }
}`,
  },
  '@if': {
    title: 'Conditional Block',
    description: 'Conditionally renders content based on an expression.',
    example: `@if ({{isLoggedIn}}) {
  @dom .welcome { children: "Hello!"; }
} @else {
  @dom .login { children: "Please log in"; }
}`,
  },
  '@for': {
    title: 'For Loop',
    description: 'Iterates over a collection to render repeated content.',
    example: `@for (item in {{items}}) {
  @dom li { children: {{item.name}}; }
}`,
  },
  '@while': {
    title: 'While Loop',
    description: 'Repeats content while a condition is true.',
    example: `@while ({{hasMore}}) {
  @dom .item { children: "Loading..."; }
}`,
  },
  '@use': {
    title: 'Use Plugin',
    description: 'Imports and activates a syntax or functionality plugin.',
    example: `@use plugin "control-flow" from "asxr-plugins/stdlib";
@use plugin "jsx-syntax" from "asxr-plugins/web";`,
  },
  '@plugin': {
    title: 'Plugin Definition',
    description: 'Defines a plugin with syntax patterns and handlers.',
    example: `@plugin myPlugin {
  version: "1.0.0",
  syntax: [{ pattern: /.../, ast_node: "MyNode" }]
}`,
  },
  '@propose': {
    title: 'State Proposal',
    description: 'Proposes a state change that can be validated before applying.',
    example: `@propose {
  state: {{counter}},
  patch: { value: {{counter.value}} + 1 }
}`,
  },
  '@constrain': {
    title: 'Constraint',
    description: 'Defines a constraint that must be satisfied for state changes.',
    example: `@constrain {{counter.value}} >= 0 => "Counter cannot be negative"`,
  },
  '@server': {
    title: 'Server Call',
    description: 'Makes a call to a server-side function.',
    example: `@server.fetchUser(userId) -> {{user}}`,
  },
  '@transform': {
    title: 'Transform Directive',
    description: 'Applies a transformation plugin to the output.',
    example: `@transform using optimizer {
  input: #myBlock,
  output: [{ language: "js", format: "esm" }]
}`,
  },
};

/**
 * Get hover information at position
 */
export function getHover(doc: Document, position: Position): Hover | null {
  const word = doc.lines[position.line]?.slice(0, position.character + 20);
  if (!word) return null;

  // Find the word at position
  const wordMatch = getWordAtPosition(doc, position);
  if (!wordMatch) return null;

  const { word: token, range } = wordMatch;

  // Check for @ keyword
  if (token.startsWith('@')) {
    const keyword = token.split(/[\s(\[{]/)[0];
    const info = KEYWORD_DOCS[keyword];
    if (info) {
      return {
        contents: {
          kind: 'markdown',
          value: formatHoverContent(info.title, info.description, info.example),
        },
        range,
      };
    }
  }

  // Check for block reference
  if (token.startsWith('#')) {
    const blockId = token.slice(1);
    const block = findBlockById(doc, blockId);
    if (block) {
      return {
        contents: {
          kind: 'markdown',
          value: `**Block Reference: \`#${blockId}\`**\n\nType: \`${block.type}\``,
        },
        range,
      };
    }
  }

  // Check for state reference
  if (token.startsWith('{{') && token.endsWith('}}')) {
    const path = token.slice(2, -2);
    return {
      contents: {
        kind: 'markdown',
        value: `**State Reference: \`{{${path}}}\`**\n\nReactive binding to state path \`${path}\``,
      },
      range,
    };
  }

  // Check for DOM element
  const domElements = ['div', 'span', 'p', 'a', 'button', 'input', 'form', 'ul', 'li', 'table', 'h1', 'h2', 'h3'];
  if (domElements.includes(token)) {
    return {
      contents: {
        kind: 'markdown',
        value: `**HTML Element: \`<${token}>\`**\n\nDOM element that will be rendered.`,
      },
      range,
    };
  }

  return null;
}

/**
 * Get word and range at position
 */
function getWordAtPosition(doc: Document, position: Position): { word: string; range: Range } | null {
  const line = doc.lines[position.line];
  if (!line) return null;

  let start = position.character;
  let end = position.character;

  // Expand to word boundaries
  while (start > 0 && /[\w@#{}.-]/.test(line[start - 1])) {
    start--;
  }
  while (end < line.length && /[\w@#{}.-]/.test(line[end])) {
    end++;
  }

  if (start === end) return null;

  return {
    word: line.slice(start, end),
    range: {
      start: { line: position.line, character: start },
      end: { line: position.line, character: end },
    },
  };
}

/**
 * Find a block by ID in the AST
 */
function findBlockById(doc: Document, id: string): { type: string } | null {
  if (!doc.ast) return null;

  function visit(node: unknown): { type: string } | null {
    if (!node || typeof node !== 'object') return null;

    const n = node as Record<string, unknown>;
    if (n.id === id || n.id === `#${id}`) {
      return { type: String(n.type ?? 'Block') };
    }

    for (const value of Object.values(n)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          const result = visit(item);
          if (result) return result;
        }
      } else if (value && typeof value === 'object') {
        const result = visit(value);
        if (result) return result;
      }
    }

    return null;
  }

  return visit(doc.ast);
}

/**
 * Format hover content as markdown
 */
function formatHoverContent(title: string, description: string, example?: string): string {
  let content = `**${title}**\n\n${description}`;

  if (example) {
    content += `\n\n**Example:**\n\`\`\`asxr\n${example}\n\`\`\``;
  }

  return content;
}
