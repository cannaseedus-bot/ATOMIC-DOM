/**
 * ASXR Language Server Protocol
 * Editor integration for ASXR
 */

// Types
export type {
  Position,
  Range,
  Location,
  Diagnostic,
  DiagnosticSeverity,
  CompletionItem,
  CompletionItemKind,
  Hover,
  DocumentSymbol,
  SymbolKind,
  TextEdit,
  ServerCapabilities,
  InitializeParams,
  InitializeResult,
  RequestMessage,
  ResponseMessage,
  NotificationMessage,
} from './types.js';

// Server
export { LanguageServer, createStdioServer } from './server.js';

// Document management
export { DocumentManager, type Document } from './documents.js';

// Providers
export { getCompletions, getTriggerCharacters } from './completion.js';
export { getHover } from './hover.js';
