/**
 * ASXR Completion Provider
 * Provides code completion suggestions
 */

import type { Document } from './documents.js';
import type { Position, CompletionItem, CompletionItemKind } from './types.js';

/**
 * ASXR keywords for completion
 */
const ASXR_KEYWORDS = [
  // Block types
  { label: '@atomic', kind: 14 as CompletionItemKind, detail: 'Atomic block', insertText: '@atomic[$1] {\n\t$0\n}' },
  { label: '@dom', kind: 14 as CompletionItemKind, detail: 'DOM block', insertText: '@dom $1 {\n\t$0\n}' },
  { label: '@component', kind: 7 as CompletionItemKind, detail: 'Component definition', insertText: '@component[$1] {\n\t$0\n}' },
  { label: '@state', kind: 6 as CompletionItemKind, detail: 'State definition', insertText: '@state[$1] {\n\t$0\n}' },
  { label: '@reactor', kind: 12 as CompletionItemKind, detail: 'Reactive block', insertText: '@reactor {\n\twhen: $1,\n\tthen: {\n\t\t$0\n\t}\n}' },

  // Control flow
  { label: '@if', kind: 14 as CompletionItemKind, detail: 'Conditional', insertText: '@if ($1) {\n\t$0\n}' },
  { label: '@else', kind: 14 as CompletionItemKind, detail: 'Else branch', insertText: '@else {\n\t$0\n}' },
  { label: '@for', kind: 14 as CompletionItemKind, detail: 'For loop', insertText: '@for ($1 in $2) {\n\t$0\n}' },
  { label: '@while', kind: 14 as CompletionItemKind, detail: 'While loop', insertText: '@while ($1) {\n\t$0\n}' },
  { label: '@switch', kind: 14 as CompletionItemKind, detail: 'Switch statement', insertText: '@switch ($1) {\n\t@case $2:\n\t\t$0\n}' },

  // Plugins and directives
  { label: '@use', kind: 9 as CompletionItemKind, detail: 'Use plugin', insertText: '@use plugin "$1" from "$2";' },
  { label: '@plugin', kind: 9 as CompletionItemKind, detail: 'Plugin definition', insertText: '@plugin $1 {\n\tversion: "$2",\n\t$0\n}' },
  { label: '@transform', kind: 12 as CompletionItemKind, detail: 'Transform directive', insertText: '@transform using $1 {\n\t$0\n}' },

  // State operations
  { label: '@propose', kind: 12 as CompletionItemKind, detail: 'State proposal', insertText: '@propose {\n\t$0\n}' },
  { label: '@constrain', kind: 12 as CompletionItemKind, detail: 'Constraint', insertText: '@constrain $1 => $0' },

  // Server calls
  { label: '@server', kind: 12 as CompletionItemKind, detail: 'Server call', insertText: '@server.$1($2)' },
];

/**
 * DOM element suggestions
 */
const DOM_ELEMENTS = [
  'div', 'span', 'p', 'a', 'button', 'input', 'form', 'label',
  'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'footer', 'nav',
  'section', 'article', 'aside', 'main', 'img', 'video', 'audio',
  'canvas', 'svg', 'iframe', 'textarea', 'select', 'option',
].map(el => ({
  label: el,
  kind: 7 as CompletionItemKind,
  detail: `HTML ${el} element`,
  insertText: `${el} {\n\t$0\n}`,
}));

/**
 * Property suggestions for blocks
 */
const BLOCK_PROPERTIES = [
  { label: 'id', kind: 10 as CompletionItemKind, detail: 'Block identifier' },
  { label: 'class', kind: 10 as CompletionItemKind, detail: 'CSS class' },
  { label: 'style', kind: 10 as CompletionItemKind, detail: 'Inline styles' },
  { label: 'prop:', kind: 10 as CompletionItemKind, detail: 'Property assignment', insertText: 'prop: $1 = $0' },
  { label: 'on:', kind: 23 as CompletionItemKind, detail: 'Event handler', insertText: 'on: $1 => $0' },
  { label: 'ref:', kind: 18 as CompletionItemKind, detail: 'Reference', insertText: 'ref: #$0' },
  { label: 'children:', kind: 18 as CompletionItemKind, detail: 'Child elements' },
];

/**
 * Get completions at position
 */
export function getCompletions(doc: Document, position: Position): CompletionItem[] {
  const line = doc.lines[position.line];
  if (!line) return [];

  const textBefore = line.slice(0, position.character);
  const completions: CompletionItem[] = [];

  // Check if we're after @
  if (textBefore.endsWith('@')) {
    // Suggest @ keywords
    return ASXR_KEYWORDS.map(kw => ({
      ...kw,
      insertTextFormat: kw.insertText ? 2 : 1, // Snippet or PlainText
    }));
  }

  // Check if we're in a @dom block
  if (textBefore.includes('@dom') || /^\s+\w*$/.test(textBefore)) {
    // Check context - are we inside a block?
    const blockContext = getBlockContext(doc, position);

    if (blockContext === 'dom') {
      // Suggest DOM elements
      completions.push(...DOM_ELEMENTS.map(el => ({
        ...el,
        insertTextFormat: 2,
      })));
    }

    // Suggest properties
    completions.push(...BLOCK_PROPERTIES.map(prop => ({
      ...prop,
      insertTextFormat: prop.insertText ? 2 : 1,
    })));
  }

  // Check if we're typing a reference
  if (textBefore.match(/#[\w-]*$/)) {
    // Suggest block references from AST
    if (doc.ast) {
      const refs = collectBlockIds(doc.ast);
      completions.push(...refs.map(ref => ({
        label: `#${ref}`,
        kind: 18 as CompletionItemKind,
        detail: 'Block reference',
      })));
    }
  }

  // Check if we're typing a state reference
  if (textBefore.match(/\{\{[\w.]*$/)) {
    // Suggest state paths from AST
    if (doc.ast) {
      const states = collectStatePaths(doc.ast);
      completions.push(...states.map(state => ({
        label: `{{${state}}}`,
        kind: 6 as CompletionItemKind,
        detail: 'State reference',
        insertText: `${state}}}`,
      })));
    }
  }

  // Default: suggest keywords
  if (completions.length === 0 && textBefore.trim() === '') {
    completions.push(...ASXR_KEYWORDS.map(kw => ({
      ...kw,
      insertTextFormat: kw.insertText ? 2 : 1,
    })));
  }

  return completions;
}

/**
 * Get the block context at position
 */
function getBlockContext(doc: Document, position: Position): 'atomic' | 'dom' | 'state' | 'none' {
  // Simple heuristic: look at preceding lines for block type
  for (let i = position.line; i >= 0; i--) {
    const line = doc.lines[i];
    if (line.includes('@dom')) return 'dom';
    if (line.includes('@atomic')) return 'atomic';
    if (line.includes('@state')) return 'state';
    if (line.match(/^\s*\}/)) break; // End of block
  }
  return 'none';
}

/**
 * Collect block IDs from AST
 */
function collectBlockIds(ast: unknown): string[] {
  const ids: string[] = [];

  function visit(node: unknown): void {
    if (!node || typeof node !== 'object') return;

    const n = node as Record<string, unknown>;
    if (n.id && typeof n.id === 'string') {
      ids.push(n.id.replace(/^#/, ''));
    }

    // Recurse
    for (const value of Object.values(n)) {
      if (Array.isArray(value)) {
        value.forEach(visit);
      } else if (value && typeof value === 'object') {
        visit(value);
      }
    }
  }

  visit(ast);
  return [...new Set(ids)];
}

/**
 * Collect state paths from AST
 */
function collectStatePaths(ast: unknown): string[] {
  const paths: string[] = [];

  function visit(node: unknown): void {
    if (!node || typeof node !== 'object') return;

    const n = node as Record<string, unknown>;

    // Look for state definitions
    if (n.type === 'StateDefinition' && n.name) {
      paths.push(String(n.name));
    }

    // Look for state references
    if (n.type === 'Reference' && n.path) {
      paths.push(String(n.path));
    }

    // Recurse
    for (const value of Object.values(n)) {
      if (Array.isArray(value)) {
        value.forEach(visit);
      } else if (value && typeof value === 'object') {
        visit(value);
      }
    }
  }

  visit(ast);
  return [...new Set(paths)];
}

/**
 * Get completion trigger characters
 */
export function getTriggerCharacters(): string[] {
  return ['@', '#', '{', '.', ':'];
}
