/**
 * ASXR Language Server Protocol Types
 * Based on LSP 3.17 specification
 */

/**
 * Position in a text document (0-indexed)
 */
export interface Position {
  line: number;
  character: number;
}

/**
 * Range in a text document
 */
export interface Range {
  start: Position;
  end: Position;
}

/**
 * Location in a document
 */
export interface Location {
  uri: string;
  range: Range;
}

/**
 * Diagnostic severity
 */
export enum DiagnosticSeverity {
  Error = 1,
  Warning = 2,
  Information = 3,
  Hint = 4,
}

/**
 * Diagnostic message
 */
export interface Diagnostic {
  range: Range;
  severity: DiagnosticSeverity;
  code?: string | number;
  source?: string;
  message: string;
  relatedInformation?: DiagnosticRelatedInformation[];
}

export interface DiagnosticRelatedInformation {
  location: Location;
  message: string;
}

/**
 * Text document identifier
 */
export interface TextDocumentIdentifier {
  uri: string;
}

export interface VersionedTextDocumentIdentifier extends TextDocumentIdentifier {
  version: number;
}

/**
 * Text document item
 */
export interface TextDocumentItem {
  uri: string;
  languageId: string;
  version: number;
  text: string;
}

/**
 * Text document content change
 */
export interface TextDocumentContentChangeEvent {
  range?: Range;
  rangeLength?: number;
  text: string;
}

/**
 * Completion item kinds
 */
export enum CompletionItemKind {
  Text = 1,
  Method = 2,
  Function = 3,
  Constructor = 4,
  Field = 5,
  Variable = 6,
  Class = 7,
  Interface = 8,
  Module = 9,
  Property = 10,
  Unit = 11,
  Value = 12,
  Enum = 13,
  Keyword = 14,
  Snippet = 15,
  Color = 16,
  File = 17,
  Reference = 18,
  Folder = 19,
  EnumMember = 20,
  Constant = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25,
}

/**
 * Completion item
 */
export interface CompletionItem {
  label: string;
  kind?: CompletionItemKind;
  detail?: string;
  documentation?: string | MarkupContent;
  deprecated?: boolean;
  preselect?: boolean;
  sortText?: string;
  filterText?: string;
  insertText?: string;
  insertTextFormat?: InsertTextFormat;
  textEdit?: TextEdit;
  additionalTextEdits?: TextEdit[];
  commitCharacters?: string[];
  command?: Command;
  data?: unknown;
}

export enum InsertTextFormat {
  PlainText = 1,
  Snippet = 2,
}

export interface TextEdit {
  range: Range;
  newText: string;
}

export interface Command {
  title: string;
  command: string;
  arguments?: unknown[];
}

export interface MarkupContent {
  kind: 'plaintext' | 'markdown';
  value: string;
}

/**
 * Hover result
 */
export interface Hover {
  contents: MarkupContent | string;
  range?: Range;
}

/**
 * Symbol kinds
 */
export enum SymbolKind {
  File = 1,
  Module = 2,
  Namespace = 3,
  Package = 4,
  Class = 5,
  Method = 6,
  Property = 7,
  Field = 8,
  Constructor = 9,
  Enum = 10,
  Interface = 11,
  Function = 12,
  Variable = 13,
  Constant = 14,
  String = 15,
  Number = 16,
  Boolean = 17,
  Array = 18,
  Object = 19,
  Key = 20,
  Null = 21,
  EnumMember = 22,
  Struct = 23,
  Event = 24,
  Operator = 25,
  TypeParameter = 26,
}

/**
 * Document symbol
 */
export interface DocumentSymbol {
  name: string;
  detail?: string;
  kind: SymbolKind;
  range: Range;
  selectionRange: Range;
  children?: DocumentSymbol[];
}

/**
 * Server capabilities
 */
export interface ServerCapabilities {
  textDocumentSync?: TextDocumentSyncOptions | number;
  completionProvider?: CompletionOptions;
  hoverProvider?: boolean;
  definitionProvider?: boolean;
  referencesProvider?: boolean;
  documentSymbolProvider?: boolean;
  documentFormattingProvider?: boolean;
  renameProvider?: boolean | RenameOptions;
  foldingRangeProvider?: boolean;
  semanticTokensProvider?: SemanticTokensOptions;
}

export interface TextDocumentSyncOptions {
  openClose?: boolean;
  change?: TextDocumentSyncKind;
  save?: SaveOptions | boolean;
}

export enum TextDocumentSyncKind {
  None = 0,
  Full = 1,
  Incremental = 2,
}

export interface SaveOptions {
  includeText?: boolean;
}

export interface CompletionOptions {
  triggerCharacters?: string[];
  resolveProvider?: boolean;
}

export interface RenameOptions {
  prepareProvider?: boolean;
}

export interface SemanticTokensOptions {
  legend: SemanticTokensLegend;
  full?: boolean | { delta?: boolean };
  range?: boolean;
}

export interface SemanticTokensLegend {
  tokenTypes: string[];
  tokenModifiers: string[];
}

/**
 * Initialize params
 */
export interface InitializeParams {
  processId: number | null;
  rootUri: string | null;
  capabilities: ClientCapabilities;
  workspaceFolders?: WorkspaceFolder[];
}

export interface ClientCapabilities {
  textDocument?: TextDocumentClientCapabilities;
  workspace?: WorkspaceClientCapabilities;
}

export interface TextDocumentClientCapabilities {
  completion?: CompletionClientCapabilities;
  hover?: HoverClientCapabilities;
  definition?: DefinitionClientCapabilities;
}

export interface CompletionClientCapabilities {
  completionItem?: {
    snippetSupport?: boolean;
    documentationFormat?: string[];
  };
}

export interface HoverClientCapabilities {
  contentFormat?: string[];
}

export interface DefinitionClientCapabilities {
  linkSupport?: boolean;
}

export interface WorkspaceClientCapabilities {
  workspaceFolders?: boolean;
}

export interface WorkspaceFolder {
  uri: string;
  name: string;
}

/**
 * Initialize result
 */
export interface InitializeResult {
  capabilities: ServerCapabilities;
  serverInfo?: {
    name: string;
    version?: string;
  };
}

/**
 * LSP Message types
 */
export interface Message {
  jsonrpc: '2.0';
}

export interface RequestMessage extends Message {
  id: number | string;
  method: string;
  params?: unknown;
}

export interface ResponseMessage extends Message {
  id: number | string | null;
  result?: unknown;
  error?: ResponseError;
}

export interface ResponseError {
  code: number;
  message: string;
  data?: unknown;
}

export interface NotificationMessage extends Message {
  method: string;
  params?: unknown;
}

/**
 * Error codes
 */
export enum ErrorCodes {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  ServerNotInitialized = -32002,
  UnknownErrorCode = -32001,
  RequestCancelled = -32800,
  ContentModified = -32801,
}
