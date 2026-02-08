/**
 * MX2LM Server Status Module
 *
 * Provides status checking and health monitoring for the server.
 */

const http = require('http');

const DEFAULT_PORT = 4141;
const DEFAULT_HOST = '127.0.0.1';

/**
 * Fetch server status from /status endpoint
 * @param {Object} options
 * @param {number} options.port - Server port
 * @param {number} options.timeout - Request timeout in ms
 * @returns {Promise<Object>}
 */
async function status(options = {}) {
  const port = options.port || DEFAULT_PORT;
  const timeout = options.timeout || 2000;

  return new Promise((resolve, reject) => {
    const req = http.get({
      hostname: DEFAULT_HOST,
      port,
      path: '/status',
      timeout
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

/**
 * Check server health via /health endpoint
 * @param {Object} options
 * @param {number} options.port - Server port
 * @param {number} options.timeout - Request timeout in ms
 * @returns {Promise<boolean>}
 */
async function health(options = {}) {
  const port = options.port || DEFAULT_PORT;
  const timeout = options.timeout || 2000;

  return new Promise((resolve) => {
    const req = http.get({
      hostname: DEFAULT_HOST,
      port,
      path: '/health',
      timeout
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.healthy === true);
        } catch {
          resolve(false);
        }
      });
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Check if server is reachable
 * @param {Object} options
 * @param {number} options.port - Server port
 * @param {number} options.timeout - Request timeout in ms
 * @returns {Promise<boolean>}
 */
async function isRunning(options = {}) {
  try {
    await status(options);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get server info from / endpoint
 * @param {Object} options
 * @param {number} options.port - Server port
 * @param {number} options.timeout - Request timeout in ms
 * @returns {Promise<Object>}
 */
async function info(options = {}) {
  const port = options.port || DEFAULT_PORT;
  const timeout = options.timeout || 2000;

  return new Promise((resolve, reject) => {
    const req = http.get({
      hostname: DEFAULT_HOST,
      port,
      path: '/',
      timeout
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

/**
 * Format status for CLI display
 * @param {Object} statusData - Status object from server
 * @returns {string}
 */
function formatStatus(statusData) {
  const lines = [
    '┌─────────────────────────────────────┐',
    '│        MX2LM Server Status          │',
    '├─────────────────────────────────────┤',
    `│ Uptime:      ${String(statusData.uptime || 0).padStart(8)} seconds    │`,
    `│ Requests:    ${String(statusData.requests || 0).padStart(8)}            │`,
    `│ Healthy:     ${String(statusData.healthy || false).padStart(8)}            │`,
    `│ WS Clients:  ${String(statusData.ws_clients || 0).padStart(8)}            │`,
    '└─────────────────────────────────────┘'
  ];
  return lines.join('\n');
}

module.exports = {
  status,
  health,
  isRunning,
  info,
  formatStatus
};
