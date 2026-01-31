/**
 * ASXR VS Code Extension
 * Provides language support for ASXR files
 */

import * as path from 'path';
import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;
let outputChannel: vscode.OutputChannel;

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext): void {
  outputChannel = vscode.window.createOutputChannel('ASXR');
  outputChannel.appendLine('ASXR extension activating...');

  // Start the language client
  startLanguageClient(context);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('asxr.restartServer', () => {
      restartLanguageClient(context);
    }),
    vscode.commands.registerCommand('asxr.showOutputChannel', () => {
      outputChannel.show();
    })
  );

  outputChannel.appendLine('ASXR extension activated');
}

/**
 * Extension deactivation
 */
export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}

/**
 * Start the language client
 */
function startLanguageClient(context: vscode.ExtensionContext): void {
  const config = vscode.workspace.getConfiguration('asxr');

  // Determine server path
  let serverPath = config.get<string>('serverPath');
  if (!serverPath) {
    // Use bundled server or global installation
    serverPath = findServerPath(context);
  }

  if (!serverPath) {
    vscode.window.showErrorMessage(
      'ASXR language server not found. Please install atomic-dom globally or set asxr.serverPath.'
    );
    return;
  }

  outputChannel.appendLine(`Using language server: ${serverPath}`);

  // Server options
  const serverOptions: ServerOptions = {
    run: {
      command: 'node',
      args: [serverPath],
      transport: TransportKind.stdio,
    },
    debug: {
      command: 'node',
      args: ['--inspect=6009', serverPath],
      transport: TransportKind.stdio,
    },
  };

  // Client options
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'asxr' }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/*.asxr'),
    },
    outputChannel,
    traceOutputChannel: outputChannel,
  };

  // Create and start the client
  client = new LanguageClient(
    'asxr',
    'ASXR Language Server',
    serverOptions,
    clientOptions
  );

  client.start();
  outputChannel.appendLine('Language server started');
}

/**
 * Restart the language client
 */
async function restartLanguageClient(context: vscode.ExtensionContext): Promise<void> {
  outputChannel.appendLine('Restarting language server...');

  if (client) {
    await client.stop();
    client = undefined;
  }

  startLanguageClient(context);
}

/**
 * Find the server path
 */
function findServerPath(context: vscode.ExtensionContext): string | undefined {
  // Check bundled server
  const bundledPath = path.join(context.extensionPath, 'server', 'lsp-server.js');
  if (require('fs').existsSync(bundledPath)) {
    return bundledPath;
  }

  // Check if asxr-lsp is in PATH
  const { execSync } = require('child_process');
  try {
    const result = execSync('which asxr-lsp 2>/dev/null || where asxr-lsp 2>nul', {
      encoding: 'utf8',
    });
    if (result.trim()) {
      return result.trim().split('\n')[0];
    }
  } catch {
    // Not found in PATH
  }

  // Check node_modules
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders) {
    for (const folder of workspaceFolders) {
      const localPath = path.join(folder.uri.fsPath, 'node_modules', 'atomic-dom', 'dist', 'lsp-server.js');
      if (require('fs').existsSync(localPath)) {
        return localPath;
      }
    }
  }

  // Check global node_modules
  try {
    const globalPath = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const serverPath = path.join(globalPath, 'atomic-dom', 'dist', 'lsp-server.js');
    if (require('fs').existsSync(serverPath)) {
      return serverPath;
    }
  } catch {
    // Ignore
  }

  return undefined;
}
