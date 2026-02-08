/**
 * MX2LM π Decay Engine
 *
 * Manages server restart policy based on π support decay.
 * When crashes occur, π support decays, naturally suppressing restarts.
 */

// π support level (1.0 = full support, 0.0 = no support)
let piSupport = 1.0;

// Crash counter
let crashCount = 0;

// Decay factor per crash
const DECAY_FACTOR = 0.6;

/**
 * Record a crash and decay π support
 */
function onCrash() {
  crashCount++;
  piSupport *= DECAY_FACTOR;
  console.log(`[π-decay] Crash #${crashCount}, π support now: ${piSupport.toFixed(3)}`);
}

/**
 * Determine restart policy based on current π support
 * @returns {'SUPPRESS' | 'ONCE' | 'BACKOFF' | 'IMMEDIATE'}
 */
function allowRestart() {
  if (piSupport < 0.4) return 'SUPPRESS';
  if (piSupport < 0.7) return 'ONCE';
  if (piSupport < 0.9) return 'BACKOFF';
  return 'IMMEDIATE';
}

/**
 * Reset π support (e.g., after manual intervention)
 */
function reset() {
  piSupport = 1.0;
  crashCount = 0;
  console.log('[π-decay] Reset to full support');
}

/**
 * Get current state
 */
function getState() {
  return {
    piSupport,
    crashCount,
    restartPolicy: allowRestart()
  };
}

/**
 * Gradually recover π support over time
 * Call this periodically when server is healthy
 */
function recover(amount = 0.05) {
  piSupport = Math.min(1.0, piSupport + amount);
}

module.exports = {
  onCrash,
  allowRestart,
  reset,
  getState,
  recover,
  get piSupport() { return piSupport; },
  get crashCount() { return crashCount; }
};
