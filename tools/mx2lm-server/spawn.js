/**
 * MX2LM Server Spawn Module
 *
 * Handles spawning the server process in a new terminal.
 * Platform-specific implementations for Windows, macOS, and Linux.
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const SERVER_SCRIPT = path.join(__dirname, 'server.khl');

/**
 * Spawn server in a new terminal window
 * @returns {ChildProcess | null}
 */
function spawnServer() {
  const platform = os.platform();

  try {
    switch (platform) {
      case 'win32':
        return spawnWindows();
      case 'darwin':
        return spawnMacOS();
      case 'linux':
        return spawnLinux();
      default:
        console.error(`[spawn] Unsupported platform: ${platform}`);
        return null;
    }
  } catch (error) {
    console.error(`[spawn] Failed to spawn server: ${error.message}`);
    return null;
  }
}

/**
 * Spawn on Windows using cmd.exe
 */
function spawnWindows() {
  return spawn('cmd.exe', [
    '/c',
    'start',
    'MX2LM Server',
    'node',
    SERVER_SCRIPT
  ], {
    detached: true,
    stdio: 'ignore',
    shell: true
  });
}

/**
 * Spawn on macOS using Terminal.app
 */
function spawnMacOS() {
  return spawn('osascript', [
    '-e',
    `tell application "Terminal" to do script "node '${SERVER_SCRIPT}'"`
  ], {
    detached: true,
    stdio: 'ignore'
  });
}

/**
 * Spawn on Linux using common terminal emulators
 */
function spawnLinux() {
  // Try common terminal emulators in order of preference
  const terminals = [
    { cmd: 'gnome-terminal', args: ['--', 'node', SERVER_SCRIPT] },
    { cmd: 'xterm', args: ['-e', 'node', SERVER_SCRIPT] },
    { cmd: 'konsole', args: ['-e', 'node', SERVER_SCRIPT] },
    { cmd: 'xfce4-terminal', args: ['-e', `node ${SERVER_SCRIPT}`] }
  ];

  for (const term of terminals) {
    try {
      const proc = spawn(term.cmd, term.args, {
        detached: true,
        stdio: 'ignore'
      });
      proc.unref();
      return proc;
    } catch {
      continue;
    }
  }

  // Fallback: run in background without terminal
  console.log('[spawn] No terminal emulator found, running in background');
  const proc = spawn('node', [SERVER_SCRIPT], {
    detached: true,
    stdio: 'ignore'
  });
  proc.unref();
  return proc;
}

/**
 * Spawn server in background (no terminal)
 * @returns {ChildProcess}
 */
function spawnBackground() {
  const proc = spawn('node', [SERVER_SCRIPT], {
    detached: true,
    stdio: 'ignore'
  });
  proc.unref();
  return proc;
}

module.exports = {
  spawnServer,
  spawnBackground,
  SERVER_SCRIPT
};
