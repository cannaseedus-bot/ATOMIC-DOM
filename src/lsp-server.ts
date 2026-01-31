#!/usr/bin/env node
/**
 * ASXR Language Server
 * Run: node dist/lsp-server.js
 */

import { createStdioServer } from './lsp/index.js';

// Start the language server
createStdioServer();
