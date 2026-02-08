#!/usr/bin/env node

/**
 * MX2LM Server CLI Module
 *
 * Commands:
 *   mx2lm-server start    - Start the server
 *   mx2lm-server stop     - Stop the server
 *   mx2lm-server restart  - Restart the server
 *   mx2lm-server status   - Show server status
 *   mx2lm-server health   - Check server health
 *   mx2lm-server reset    - Reset π decay state
 */

const { start, stop, restart, status: lifecycleStatus } = require('./lifecycle.js');
const { status: serverStatus, health, isRunning, formatStatus } = require('./status.js');
const { reset, getState } = require('./decay.js');

const VERSION = '1.0.0';

// Parse command
const cmd = process.argv[2];
const flags = process.argv.slice(3);

/**
 * Print help message
 */
function printHelp() {
  console.log(`
MX2LM Server CLI v${VERSION}

Usage: mx2lm-server <command> [options]

Commands:
  start       Start the server
  stop        Stop the server
  restart     Restart the server
  status      Show server status
  health      Check server health
  reset       Reset π decay state
  help        Show this help message

Options:
  --background, -b    Run server in background (no terminal)
  --port <port>       Specify server port (default: 4141)

Examples:
  mx2lm-server start
  mx2lm-server start --background
  mx2lm-server status
  mx2lm-server restart
`);
}

/**
 * Main command handler
 */
async function main() {
  const background = flags.includes('--background') || flags.includes('-b');

  switch (cmd) {
    case 'start':
      start({ background });
      break;

    case 'stop':
      stop();
      break;

    case 'restart':
      await restart();
      break;

    case 'status':
      try {
        // First check if server is running
        const running = await isRunning();
        if (!running) {
          console.log('Server is not running');

          // Show lifecycle state
          const state = lifecycleStatus();
          console.log(`\nLifecycle State:`);
          console.log(`  π Support: ${state.piSupport.toFixed(3)}`);
          console.log(`  Crash Count: ${state.crashCount}`);
          console.log(`  Restart Policy: ${state.restartPolicy}`);
          break;
        }

        // Get server status
        const data = await serverStatus();
        console.log(formatStatus(data));

        // Show lifecycle state
        const state = lifecycleStatus();
        console.log(`\nLifecycle State:`);
        console.log(`  PID: ${state.pid || 'unknown'}`);
        console.log(`  π Support: ${state.piSupport.toFixed(3)}`);
        console.log(`  Restart Count: ${state.restartCount}`);
      } catch (error) {
        console.log(`Server unreachable: ${error.message}`);
      }
      break;

    case 'health':
      const isHealthy = await health();
      console.log(`Server health: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
      process.exit(isHealthy ? 0 : 1);
      break;

    case 'reset':
      reset();
      console.log('π decay state reset');
      const newState = getState();
      console.log(`  π Support: ${newState.piSupport.toFixed(3)}`);
      console.log(`  Crash Count: ${newState.crashCount}`);
      break;

    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;

    case 'version':
    case '--version':
    case '-v':
      console.log(`MX2LM Server CLI v${VERSION}`);
      break;

    default:
      if (cmd) {
        console.error(`Unknown command: ${cmd}`);
      }
      printHelp();
      process.exit(1);
  }
}

// Run main
main().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
