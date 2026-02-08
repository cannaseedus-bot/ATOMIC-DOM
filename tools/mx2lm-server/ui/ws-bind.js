/**
 * MX2LM WebSocket → CSS Variable Binding
 *
 * Projection glue that connects server status to CSS micronauts.
 * This is NOT logic - it's a pure data → CSS variable mapping.
 */

(function() {
  'use strict';

  const CONFIG = {
    wsUrl: 'ws://127.0.0.1:4141/ws/status',
    reconnectDelay: 3000,
    maxReconnectDelay: 30000
  };

  let ws = null;
  let reconnectTimer = null;
  let reconnectDelay = CONFIG.reconnectDelay;

  /**
   * Set CSS custom property on document root
   */
  function setCSSVar(name, value) {
    document.documentElement.style.setProperty(`--mx2lm-${name}`, value);
  }

  /**
   * Update all CSS variables from status snapshot
   */
  function updateFromSnapshot(snapshot) {
    // Health: 1 if healthy, 0.2 if unhealthy
    const health = snapshot.healthy ? 1 : 0.2;
    setCSSVar('health', health);

    // Uptime in seconds
    setCSSVar('uptime', snapshot.uptime || 0);

    // Traffic: normalized (0-1), capped at 100 requests
    const traffic = Math.min(1, (snapshot.requests || 0) / 100);
    setCSSVar('traffic', traffic);

    // Glow: max of health and traffic
    const glow = Math.max(health * 0.5, traffic);
    setCSSVar('glow', glow);
  }

  /**
   * Reset CSS variables to default state
   */
  function resetVars() {
    setCSSVar('health', 0);
    setCSSVar('uptime', 0);
    setCSSVar('traffic', 0);
    setCSSVar('glow', 0);
  }

  /**
   * Connect to WebSocket server
   */
  function connect() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      ws = new WebSocket(CONFIG.wsUrl);

      ws.onopen = function() {
        console.log('[MX2LM] Connected to server');
        reconnectDelay = CONFIG.reconnectDelay;
      };

      ws.onmessage = function(event) {
        try {
          const snapshot = JSON.parse(event.data);
          updateFromSnapshot(snapshot);
        } catch (e) {
          console.warn('[MX2LM] Invalid message:', e);
        }
      };

      ws.onclose = function() {
        console.log('[MX2LM] Disconnected, reconnecting...');
        resetVars();
        scheduleReconnect();
      };

      ws.onerror = function(error) {
        console.warn('[MX2LM] WebSocket error:', error);
      };

    } catch (error) {
      console.error('[MX2LM] Failed to connect:', error);
      scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  function scheduleReconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    reconnectTimer = setTimeout(function() {
      connect();
      // Exponential backoff
      reconnectDelay = Math.min(reconnectDelay * 1.5, CONFIG.maxReconnectDelay);
    }, reconnectDelay);
  }

  /**
   * Disconnect and cleanup
   */
  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (ws) {
      ws.close();
      ws = null;
    }

    resetVars();
  }

  // Auto-connect on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connect);
  } else {
    connect();
  }

  // Cleanup on unload
  window.addEventListener('beforeunload', disconnect);

  // Export for manual control
  window.MX2LM = {
    connect: connect,
    disconnect: disconnect,
    resetVars: resetVars
  };

})();
