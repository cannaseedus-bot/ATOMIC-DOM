/**
 * ASXR Language Server
 * Implements the Language Server Protocol for ASXR
 */

import { DocumentManager } from './documents.js';
import { getCompletions, getTriggerCharacters } from './completion.js';
import { getHover } from './hover.js';
import {
  TextDocumentSyncKind,
  SymbolKind,
} from './types.js';
import type {
  InitializeParams,
  InitializeResult,
  ServerCapabilities,
  RequestMessage,
  ResponseMessage,
  NotificationMessage,
  TextDocumentItem,
  TextDocumentContentChangeEvent,
  Position,
  Diagnostic,
  CompletionItem,
  Hover,
  DocumentSymbol,
  Location,
} from './types.js';

/**
 * Language Server class
 */
export class LanguageServer {
  private documents: DocumentManager;
  private initialized = false;

  constructor() {
    this.documents = new DocumentManager();
  }

  /**
   * Handle incoming message
   */
  handleMessage(message: RequestMessage | NotificationMessage): ResponseMessage | null {
    if ('id' in message) {
      return this.handleRequest(message);
    } else {
      this.handleNotification(message);
      return null;
    }
  }

  /**
   * Handle request
   */
  private handleRequest(request: RequestMessage): ResponseMessage {
    const { id, method, params } = request;

    try {
      let result: unknown;

      switch (method) {
        case 'initialize':
          result = this.initialize(params as InitializeParams);
          break;

        case 'shutdown':
          result = this.shutdown();
          break;

        case 'textDocument/completion':
          result = this.completion(params as { textDocument: { uri: string }; position: Position });
          break;

        case 'textDocument/hover':
          result = this.hover(params as { textDocument: { uri: string }; position: Position });
          break;

        case 'textDocument/definition':
          result = this.definition(params as { textDocument: { uri: string }; position: Position });
          break;

        case 'textDocument/references':
          result = this.references(params as { textDocument: { uri: string }; position: Position });
          break;

        case 'textDocument/documentSymbol':
          result = this.documentSymbols(params as { textDocument: { uri: string } });
          break;

        case 'textDocument/formatting':
          result = this.format(params as { textDocument: { uri: string } });
          break;

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Method not found: ${method}`,
            },
          };
      }

      return {
        jsonrpc: '2.0',
        id,
        result,
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: (error as Error).message,
        },
      };
    }
  }

  /**
   * Handle notification
   */
  private handleNotification(notification: NotificationMessage): void {
    const { method, params } = notification;

    switch (method) {
      case 'initialized':
        this.initialized = true;
        break;

      case 'exit':
        process.exit(this.initialized ? 0 : 1);
        break;

      case 'textDocument/didOpen':
        this.didOpen(params as { textDocument: TextDocumentItem });
        break;

      case 'textDocument/didChange':
        this.didChange(params as {
          textDocument: { uri: string; version: number };
          contentChanges: TextDocumentContentChangeEvent[];
        });
        break;

      case 'textDocument/didClose':
        this.didClose(params as { textDocument: { uri: string } });
        break;

      case 'textDocument/didSave':
        this.didSave(params as { textDocument: { uri: string } });
        break;
    }
  }

  /**
   * Initialize the server
   */
  private initialize(_params: InitializeParams): InitializeResult {
    const capabilities: ServerCapabilities = {
      textDocumentSync: {
        openClose: true,
        change: TextDocumentSyncKind.Incremental,
        save: { includeText: true },
      },
      completionProvider: {
        triggerCharacters: getTriggerCharacters(),
        resolveProvider: false,
      },
      hoverProvider: true,
      definitionProvider: true,
      referencesProvider: true,
      documentSymbolProvider: true,
      documentFormattingProvider: true,
    };

    return {
      capabilities,
      serverInfo: {
        name: 'asxr-language-server',
        version: '0.1.0',
      },
    };
  }

  /**
   * Shutdown the server
   */
  private shutdown(): null {
    return null;
  }

  /**
   * Document opened
   */
  private didOpen(params: { textDocument: TextDocumentItem }): void {
    const doc = this.documents.open(params.textDocument);
    this.publishDiagnostics(doc.uri, doc.diagnostics);
  }

  /**
   * Document changed
   */
  private didChange(params: {
    textDocument: { uri: string; version: number };
    contentChanges: TextDocumentContentChangeEvent[];
  }): void {
    const doc = this.documents.update(
      params.textDocument.uri,
      params.textDocument.version,
      params.contentChanges
    );
    if (doc) {
      this.publishDiagnostics(doc.uri, doc.diagnostics);
    }
  }

  /**
   * Document closed
   */
  private didClose(params: { textDocument: { uri: string } }): void {
    this.documents.close(params.textDocument.uri);
    this.publishDiagnostics(params.textDocument.uri, []);
  }

  /**
   * Document saved
   */
  private didSave(_params: { textDocument: { uri: string } }): void {
    // Re-validate on save if needed
  }

  /**
   * Publish diagnostics to client
   */
  private publishDiagnostics(uri: string, diagnostics: Diagnostic[]): void {
    const notification: NotificationMessage = {
      jsonrpc: '2.0',
      method: 'textDocument/publishDiagnostics',
      params: {
        uri,
        diagnostics,
      },
    };

    this.sendNotification(notification);
  }

  /**
   * Send notification to client (override in implementation)
   */
  protected sendNotification(_notification: NotificationMessage): void {
    // Override in transport-specific implementation
  }

  /**
   * Get completions
   */
  private completion(params: { textDocument: { uri: string }; position: Position }): CompletionItem[] {
    const doc = this.documents.get(params.textDocument.uri);
    if (!doc) return [];

    return getCompletions(doc, params.position);
  }

  /**
   * Get hover information
   */
  private hover(params: { textDocument: { uri: string }; position: Position }): Hover | null {
    const doc = this.documents.get(params.textDocument.uri);
    if (!doc) return null;

    return getHover(doc, params.position);
  }

  /**
   * Go to definition
   */
  private definition(params: { textDocument: { uri: string }; position: Position }): Location | null {
    const doc = this.documents.get(params.textDocument.uri);
    if (!doc || !doc.ast) return null;

    const word = this.documents.get(params.textDocument.uri)?.lines[params.position.line];
    if (!word) return null;

    // Find reference at position
    const wordRange = doc.lines[params.position.line]?.slice(
      Math.max(0, params.position.character - 20),
      params.position.character + 20
    );

    // Look for block reference
    const refMatch = wordRange?.match(/#([\w-]+)/);
    if (refMatch) {
      const blockId = refMatch[1];
      const location = this.findBlockDefinition(doc, blockId);
      if (location) return location;
    }

    return null;
  }

  /**
   * Find block definition
   */
  private findBlockDefinition(doc: { uri: string; content: string; lines: string[] }, blockId: string): Location | null {
    // Search for block definition
    const pattern = new RegExp(`@(atomic|dom|component|state)\\s*\\[${blockId}\\]`, 'i');

    for (let line = 0; line < doc.lines.length; line++) {
      const match = doc.lines[line].match(pattern);
      if (match) {
        const character = doc.lines[line].indexOf(match[0]);
        return {
          uri: doc.uri,
          range: {
            start: { line, character },
            end: { line, character: character + match[0].length },
          },
        };
      }
    }

    return null;
  }

  /**
   * Find references
   */
  private references(params: { textDocument: { uri: string }; position: Position }): Location[] {
    const doc = this.documents.get(params.textDocument.uri);
    if (!doc) return [];

    // Get word at position
    const word = doc.lines[params.position.line]?.slice(
      Math.max(0, params.position.character - 20),
      params.position.character + 20
    );

    // Look for block ID
    const match = word?.match(/@\w+\[([\w-]+)\]|#([\w-]+)/);
    const blockId = match?.[1] ?? match?.[2];
    if (!blockId) return [];

    // Find all references
    const locations: Location[] = [];
    const pattern = new RegExp(`#${blockId}\\b`, 'g');

    for (let line = 0; line < doc.lines.length; line++) {
      let match;
      while ((match = pattern.exec(doc.lines[line])) !== null) {
        locations.push({
          uri: doc.uri,
          range: {
            start: { line, character: match.index },
            end: { line, character: match.index + match[0].length },
          },
        });
      }
    }

    return locations;
  }

  /**
   * Get document symbols
   */
  private documentSymbols(params: { textDocument: { uri: string } }): DocumentSymbol[] {
    const doc = this.documents.get(params.textDocument.uri);
    if (!doc || !doc.ast) return [];

    const symbols: DocumentSymbol[] = [];

    function visit(node: unknown, parent: DocumentSymbol | null = null): void {
      if (!node || typeof node !== 'object') return;

      const n = node as Record<string, unknown>;
      let symbol: DocumentSymbol | null = null;

      // Create symbols for blocks
      if (n.type === 'AtomicBlock' || n.type === 'DomBlock' || n.type === 'ComponentDef') {
        const name = String(n.id ?? n.blockType ?? n.selector ?? 'block');
        const kind = n.type === 'ComponentDef' ? SymbolKind.Class
          : n.type === 'AtomicBlock' ? SymbolKind.Module
          : SymbolKind.Object;

        symbol = {
          name,
          kind,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          selectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          children: [],
        };

        if (parent) {
          parent.children?.push(symbol);
        } else {
          symbols.push(symbol);
        }
      }

      // Recurse into children
      if (n.body && Array.isArray(n.body)) {
        for (const child of n.body) {
          visit(child, symbol ?? parent);
        }
      }
      if (n.children && Array.isArray(n.children)) {
        for (const child of n.children) {
          visit(child, symbol ?? parent);
        }
      }
    }

    if (doc.ast.body) {
      for (const item of doc.ast.body) {
        visit(item);
      }
    }

    return symbols;
  }

  /**
   * Format document
   */
  private format(_params: { textDocument: { uri: string } }): null {
    // TODO: Implement formatting
    return null;
  }
}

/**
 * Create a stdio-based language server
 */
export function createStdioServer(): LanguageServer {
  const server = new StdioLanguageServer();
  server.start();
  return server;
}

/**
 * Stdio transport implementation
 */
class StdioLanguageServer extends LanguageServer {
  private buffer = '';

  start(): void {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk: string) => this.handleData(chunk));
    process.stdin.on('end', () => process.exit(0));
  }

  private handleData(chunk: string): void {
    this.buffer += chunk;

    while (true) {
      // Parse Content-Length header
      const headerEnd = this.buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) break;

      const header = this.buffer.slice(0, headerEnd);
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        this.buffer = this.buffer.slice(headerEnd + 4);
        continue;
      }

      const contentLength = parseInt(match[1], 10);
      const messageStart = headerEnd + 4;
      const messageEnd = messageStart + contentLength;

      if (this.buffer.length < messageEnd) break;

      const content = this.buffer.slice(messageStart, messageEnd);
      this.buffer = this.buffer.slice(messageEnd);

      try {
        const message = JSON.parse(content) as RequestMessage | NotificationMessage;
        const response = this.handleMessage(message);

        if (response) {
          this.send(response);
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    }
  }

  protected sendNotification(notification: NotificationMessage): void {
    this.send(notification);
  }

  private send(message: ResponseMessage | NotificationMessage): void {
    const content = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n`;
    process.stdout.write(header + content);
  }
}
