/**
 * ASXR Document Manager
 * Manages open documents and their state
 */

import type { Program } from '../parser/ast.js';
import { Parser } from '../parser/parser.js';
import { validate } from '../validator/index.js';
import type {
  TextDocumentItem,
  TextDocumentContentChangeEvent,
  Position,
  Range,
  Diagnostic,
  DiagnosticSeverity,
} from './types.js';

/**
 * Represents an open document
 */
export interface Document {
  uri: string;
  languageId: string;
  version: number;
  content: string;
  lines: string[];
  ast?: Program;
  parseErrors: ParseError[];
  diagnostics: Diagnostic[];
}

interface ParseError {
  message: string;
  line: number;
  column: number;
}

/**
 * Document manager
 */
export class DocumentManager {
  private documents: Map<string, Document> = new Map();

  /**
   * Open a document
   */
  open(item: TextDocumentItem): Document {
    const doc = this.createDocument(item.uri, item.languageId, item.version, item.text);
    this.documents.set(item.uri, doc);
    return doc;
  }

  /**
   * Update a document
   */
  update(
    uri: string,
    version: number,
    changes: TextDocumentContentChangeEvent[]
  ): Document | undefined {
    const doc = this.documents.get(uri);
    if (!doc) return undefined;

    // Apply changes
    let content = doc.content;
    for (const change of changes) {
      if (change.range) {
        // Incremental update
        const start = this.offsetAt(doc, change.range.start);
        const end = this.offsetAt(doc, change.range.end);
        content = content.slice(0, start) + change.text + content.slice(end);
      } else {
        // Full update
        content = change.text;
      }
    }

    // Recreate document with new content
    const updated = this.createDocument(uri, doc.languageId, version, content);
    this.documents.set(uri, updated);
    return updated;
  }

  /**
   * Close a document
   */
  close(uri: string): void {
    this.documents.delete(uri);
  }

  /**
   * Get a document
   */
  get(uri: string): Document | undefined {
    return this.documents.get(uri);
  }

  /**
   * Get all documents
   */
  all(): Document[] {
    return Array.from(this.documents.values());
  }

  /**
   * Create a new document with parsing
   */
  private createDocument(
    uri: string,
    languageId: string,
    version: number,
    content: string
  ): Document {
    const lines = content.split('\n');
    const parseErrors: ParseError[] = [];
    const diagnostics: Diagnostic[] = [];
    let ast: Program | undefined;

    // Parse the document
    try {
      const parser = new Parser(content);
      ast = parser.parse();

      // Collect parse errors
      for (const error of parser.getErrors()) {
        parseErrors.push({
          message: error.message,
          line: error.position.line,
          column: error.position.column,
        });

        diagnostics.push({
          range: {
            start: { line: error.position.line - 1, character: error.position.column - 1 },
            end: { line: error.position.line - 1, character: error.position.column + 10 },
          },
          severity: 1, // Error
          source: 'asxr',
          message: error.message,
        });
      }

      // Run validation if parsing succeeded
      if (ast && parseErrors.length === 0) {
        const validation = validate(ast, {
          schemas: true,
          laws: true,
          checkReferences: true,
        });

        for (const diag of validation.diagnostics) {
          const severity = diag.severity === 'error' ? 1 : diag.severity === 'warning' ? 2 : 3;
          diagnostics.push({
            range: {
              start: { line: (diag.location?.line ?? 1) - 1, character: (diag.location?.column ?? 1) - 1 },
              end: { line: (diag.location?.line ?? 1) - 1, character: (diag.location?.column ?? 1) + 20 },
            },
            severity: severity as DiagnosticSeverity,
            source: 'asxr',
            code: diag.code,
            message: diag.message,
          });
        }
      }
    } catch (e) {
      const error = e as Error;
      parseErrors.push({
        message: error.message,
        line: 1,
        column: 1,
      });
      diagnostics.push({
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 100 },
        },
        severity: 1,
        source: 'asxr',
        message: `Parse error: ${error.message}`,
      });
    }

    return {
      uri,
      languageId,
      version,
      content,
      lines,
      ast,
      parseErrors,
      diagnostics,
    };
  }

  /**
   * Get offset from position
   */
  private offsetAt(doc: Document, position: Position): number {
    let offset = 0;
    for (let i = 0; i < position.line && i < doc.lines.length; i++) {
      offset += doc.lines[i].length + 1; // +1 for newline
    }
    offset += position.character;
    return offset;
  }

  /**
   * Get position from offset
   */
  positionAt(doc: Document, offset: number): Position {
    let remaining = offset;
    for (let line = 0; line < doc.lines.length; line++) {
      const lineLength = doc.lines[line].length + 1;
      if (remaining < lineLength) {
        return { line, character: remaining };
      }
      remaining -= lineLength;
    }
    return { line: doc.lines.length - 1, character: doc.lines[doc.lines.length - 1]?.length ?? 0 };
  }

  /**
   * Get word at position
   */
  getWordAt(doc: Document, position: Position): string | undefined {
    const line = doc.lines[position.line];
    if (!line) return undefined;

    // Find word boundaries
    let start = position.character;
    let end = position.character;

    while (start > 0 && /[\w@#-]/.test(line[start - 1])) {
      start--;
    }
    while (end < line.length && /[\w@#-]/.test(line[end])) {
      end++;
    }

    if (start === end) return undefined;
    return line.slice(start, end);
  }

  /**
   * Get word range at position
   */
  getWordRangeAt(doc: Document, position: Position): Range | undefined {
    const line = doc.lines[position.line];
    if (!line) return undefined;

    let start = position.character;
    let end = position.character;

    while (start > 0 && /[\w@#-]/.test(line[start - 1])) {
      start--;
    }
    while (end < line.length && /[\w@#-]/.test(line[end])) {
      end++;
    }

    if (start === end) return undefined;
    return {
      start: { line: position.line, character: start },
      end: { line: position.line, character: end },
    };
  }
}
