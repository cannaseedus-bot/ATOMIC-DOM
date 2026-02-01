/**
 * ATOMIC-DOM CLI Module
 * Interactive setup and project management
 */

export {
  runSetup,
  quickSetup,
  printHelp,
  printVersion,
  printLogo,
  SetupWizard,
  COLORS,
  colorize,
  startPlayground,
} from './setup.js';

export type { AtomicConfig, ProjectionMode } from './setup.js';
