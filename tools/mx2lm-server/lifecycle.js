/**
 * MX2LM Server Lifecycle Controller
 *
 * Manages server process lifecycle with π-decay integration.
 * Handles start, stop, restart, and crash recovery.
 */

const { spawnServer, spawnBackground } = require('./spawn.js');
const { onCrash, allowRestart, getState, recover } = require('./decay.js');

// Current server process
let proc = null;

// Server state tracking
let serverState = {
  pid: null,
  port: 4141,
  startedAt: null,
  restartCount: 0,
  lastCrash: null,
  isRunning: false
};

// Backoff timer handle
let backoffTimer = null;

/**
 * Start the server
 * @param {Object} options
 * @param {boolean} options.background - Run in background without terminal
 * @returns {boolean} - Success status
 */
function start(options = {}) {
  if (proc && serverState.isRunning) {
    console.log('[lifecycle] Server already running');
    return false;
  }

  console.log('[lifecycle] Starting server...');

  proc = options.background ? spawnBackground() : spawnServer();

  if (proc) {
    serverState.pid = proc.pid;
    serverState.startedAt = Date.now();
    serverState.isRunning = true;

    // Monitor process exit
    proc.on('exit', handleExit);

    console.log(`[lifecycle] Server started (PID: ${proc.pid})`);
    return true;
  }

  console.error('[lifecycle] Failed to start server');
  return false;
}

/**
 * Stop the server
 * @returns {boolean} - Success status
 */
function stop() {
  if (!proc) {
    console.log('[lifecycle] No server running');
    return false;
  }

  console.log('[lifecycle] Stopping server...');

  try {
    // Kill process group on Unix, individual process on Windows
    if (process.platform !== 'win32') {
      process.kill(-proc.pid, 'SIGTERM');
    } else {
      proc.kill('SIGTERM');
    }

    serverState.isRunning = false;
    serverState.pid = null;
    proc = null;

    console.log('[lifecycle] Server stopped');
    return true;
  } catch (error) {
    console.error(`[lifecycle] Failed to stop: ${error.message}`);
    return false;
  }
}

/**
 * Restart the server
 * @returns {boolean} - Success status
 */
function restart() {
  console.log('[lifecycle] Restarting server...');
  stop();

  // Small delay before restart
  return new Promise(resolve => {
    setTimeout(() => {
      const success = start();
      if (success) {
        serverState.restartCount++;
      }
      resolve(success);
    }, 500);
  });
}

/**
 * Handle process exit (crash or clean shutdown)
 * @param {number} code - Exit code
 * @param {string} signal - Signal that caused exit
 */
function handleExit(code, signal) {
  serverState.isRunning = false;
  serverState.pid = null;
  proc = null;

  // Clean shutdown
  if (code === 0 || signal === 'SIGTERM' || signal === 'SIGINT') {
    console.log('[lifecycle] Server exited cleanly');
    return;
  }

  // Crash detected
  console.log(`[lifecycle] Server crashed (code: ${code}, signal: ${signal})`);
  serverState.lastCrash = Date.now();
  onCrash();

  // Determine restart policy
  const mode = allowRestart();
  console.log(`[lifecycle] Restart policy: ${mode}`);

  switch (mode) {
    case 'SUPPRESS':
      console.log('[lifecycle] Restart suppressed due to low π support');
      break;
    case 'ONCE':
      console.log('[lifecycle] Attempting single restart...');
      start();
      break;
    case 'BACKOFF':
      console.log('[lifecycle] Scheduling restart with backoff (3s)...');
      backoffTimer = setTimeout(() => start(), 3000);
      break;
    case 'IMMEDIATE':
      console.log('[lifecycle] Immediate restart...');
      start();
      break;
  }
}

/**
 * Get current server status
 * @returns {Object}
 */
function status() {
  const decay = getState();
  return {
    ...serverState,
    uptime: serverState.startedAt
      ? Math.floor((Date.now() - serverState.startedAt) / 1000)
      : 0,
    piSupport: decay.piSupport,
    crashCount: decay.crashCount,
    restartPolicy: decay.restartPolicy
  };
}

/**
 * Cancel pending backoff restart
 */
function cancelBackoff() {
  if (backoffTimer) {
    clearTimeout(backoffTimer);
    backoffTimer = null;
    console.log('[lifecycle] Backoff restart cancelled');
  }
}

module.exports = {
  start,
  stop,
  restart,
  status,
  cancelBackoff,
  crashed: handleExit.bind(null, 1, null)
};
