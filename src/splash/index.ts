/**
 * ATOMIC-DOM Splash Runtime
 * Boot screen and loading management for ATOMIC-DOM apps
 */

export interface SplashConfig {
  /** Logo URL or SVG string */
  logo?: string;
  /** App title */
  title?: string;
  /** Subtitle or tagline */
  subtitle?: string;
  /** Theme: 'dark' | 'light' */
  theme?: 'dark' | 'light';
  /** Minimum display time in ms (default: 800) */
  minDisplayTime?: number;
  /** Show progress bar */
  showProgress?: boolean;
  /** Custom CSS class for splash container */
  className?: string;
  /** Progress callback */
  onProgress?: (percent: number) => void;
  /** Ready callback */
  onReady?: (app: SplashRuntime) => void;
  /** Error callback */
  onError?: (error: Error) => void;
}

export interface SplashRuntime {
  /** Start the splash screen */
  start(): Promise<void>;
  /** Update progress (0-100) */
  setProgress(percent: number): void;
  /** Complete and hide splash */
  complete(): Promise<void>;
  /** Get splash element */
  getElement(): HTMLElement | null;
  /** Destroy splash */
  destroy(): void;
}

const DEFAULT_CONFIG: Required<SplashConfig> = {
  logo: '',
  title: 'Loading...',
  subtitle: '',
  theme: 'dark',
  minDisplayTime: 800,
  showProgress: true,
  className: '',
  onProgress: () => {},
  onReady: () => {},
  onError: () => {},
};

const ATOMIC_LOGO_SVG = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0-2.25l2.25 1.313M4.5 9.75l2.25-1.313M4.5 9.75l2.25 1.313M4.5 9.75V12m12.75-2.25l-2.25-1.313m2.25-1.313l-2.25 1.313m0 0v2.25m2.25-2.25l-2.25 1.313M6.75 12l2.25-1.313M6.75 12l2.25 1.313M6.75 12V15m10.5-3l-2.25-1.313m2.25-1.313l-2.25 1.313m0 0v2.25m2.25-2.25l-2.25 1.313M9 14.25l2.25-1.313M9 14.25l2.25 1.313M9 14.25V17.25m3-3l2.25-1.313M12 14.25l-2.25-1.313M12 14.25V17.25m3-3l2.25-1.313m2.25-1.313l-2.25 1.313m0 0v2.25m2.25-2.25l-2.25 1.313"/>
</svg>
`;

/**
 * Create a splash runtime instance
 */
export function createSplashRuntime(config: SplashConfig = {}): SplashRuntime {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  let splashElement: HTMLElement | null = null;
  let progressElement: HTMLElement | null = null;
  let startTime = 0;
  let currentProgress = 0;

  const styles = cfg.theme === 'dark' ? {
    bg: '#0f172a',
    fg: '#f8fafc',
    primary: '#0891b2',
    secondary: '#10b981',
    muted: '#64748b',
  } : {
    bg: '#f8fafc',
    fg: '#0f172a',
    primary: '#0891b2',
    secondary: '#10b981',
    muted: '#94a3b8',
  };

  function createSplashHTML(): string {
    const logoContent = cfg.logo
      ? (cfg.logo.startsWith('<') ? cfg.logo : `<img src="${cfg.logo}" alt="Logo" style="width:64px;height:64px">`)
      : ATOMIC_LOGO_SVG;

    return `
      <div class="atomic-splash ${cfg.className}" style="
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: ${styles.bg};
        color: ${styles.fg};
        font-family: system-ui, -apple-system, sans-serif;
        z-index: 99999;
        transition: opacity 0.3s ease-out;
      ">
        <div class="atomic-splash-content" style="text-align: center;">
          <div class="atomic-splash-logo" style="
            width: 80px;
            height: 80px;
            margin: 0 auto 24px;
            color: ${styles.primary};
            animation: atomic-pulse 2s ease-in-out infinite;
          ">
            ${logoContent}
          </div>
          <h1 class="atomic-splash-title" style="
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 8px;
            color: ${styles.fg};
          ">${cfg.title}</h1>
          ${cfg.subtitle ? `
          <p class="atomic-splash-subtitle" style="
            font-size: 14px;
            margin: 0 0 24px;
            color: ${styles.muted};
          ">${cfg.subtitle}</p>
          ` : ''}
          ${cfg.showProgress ? `
          <div class="atomic-splash-progress-container" style="
            width: 200px;
            height: 4px;
            background: ${styles.muted}33;
            border-radius: 2px;
            overflow: hidden;
            margin: 24px auto 0;
          ">
            <div class="atomic-splash-progress" style="
              width: 0%;
              height: 100%;
              background: linear-gradient(90deg, ${styles.primary}, ${styles.secondary});
              border-radius: 2px;
              transition: width 0.3s ease-out;
            "></div>
          </div>
          ` : ''}
        </div>
      </div>
      <style>
        @keyframes atomic-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .atomic-splash-logo svg {
          width: 100%;
          height: 100%;
        }
      </style>
    `;
  }

  function injectSplash(): void {
    const wrapper = document.createElement('div');
    wrapper.id = 'atomic-splash-wrapper';
    wrapper.innerHTML = createSplashHTML();
    document.body.insertBefore(wrapper, document.body.firstChild);
    splashElement = wrapper.querySelector('.atomic-splash');
    progressElement = wrapper.querySelector('.atomic-splash-progress');
  }

  function setProgress(percent: number): void {
    currentProgress = Math.min(100, Math.max(0, percent));
    if (progressElement) {
      progressElement.style.width = `${currentProgress}%`;
    }
    cfg.onProgress(currentProgress);
  }

  async function complete(): Promise<void> {
    // Ensure minimum display time
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, cfg.minDisplayTime - elapsed);

    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }

    // Set progress to 100%
    setProgress(100);

    // Fade out
    if (splashElement) {
      splashElement.style.opacity = '0';
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Call ready
    cfg.onReady(runtime);
  }

  function destroy(): void {
    const wrapper = document.getElementById('atomic-splash-wrapper');
    if (wrapper) {
      wrapper.remove();
    }
    splashElement = null;
    progressElement = null;
  }

  async function start(): Promise<void> {
    startTime = Date.now();
    injectSplash();

    // Auto-progress simulation if no manual control
    if (cfg.showProgress) {
      const autoProgress = setInterval(() => {
        if (currentProgress < 90) {
          setProgress(currentProgress + Math.random() * 10);
        }
      }, 200);

      // Clean up auto-progress after min time
      setTimeout(() => clearInterval(autoProgress), cfg.minDisplayTime);
    }
  }

  const runtime: SplashRuntime = {
    start,
    setProgress,
    complete,
    getElement: () => splashElement,
    destroy,
  };

  return runtime;
}

/**
 * Simple boot function for quick setup
 */
export async function boot(options: {
  splash?: SplashConfig;
  load?: () => Promise<void>;
  mount?: () => void;
} = {}): Promise<void> {
  const splash = createSplashRuntime(options.splash);

  try {
    await splash.start();

    if (options.load) {
      await options.load();
    }

    splash.setProgress(100);
    await splash.complete();

    if (options.mount) {
      options.mount();
    }

    splash.destroy();
  } catch (error) {
    splash.destroy();
    throw error;
  }
}

/**
 * AtomicApp class for full application management
 */
export class AtomicApp {
  private config: {
    root: string;
    splash: SplashConfig;
  };
  private splashRuntime: SplashRuntime | null = null;
  private state: Record<string, unknown> = {};
  private _routes: Record<string, unknown> = {};
  private readyCallbacks: Array<() => void> = [];

  constructor(config: { root?: string; splash?: SplashConfig } = {}) {
    this.config = {
      root: config.root || '#app',
      splash: config.splash || {},
    };
  }

  async init(asxUrl?: string): Promise<void> {
    this.splashRuntime = createSplashRuntime(this.config.splash);
    await this.splashRuntime.start();

    if (asxUrl) {
      try {
        const response = await fetch(asxUrl);
        const cfg = await response.json();
        this.state = cfg.$state || {};
        this._routes = cfg.$routes || {};
      } catch (error) {
        console.error('Failed to load ASX config:', error);
      }
    }

    this.splashRuntime.setProgress(100);
    await this.splashRuntime.complete();
    this.splashRuntime.destroy();

    // Notify ready callbacks
    for (const cb of this.readyCallbacks) {
      cb();
    }
  }

  mount(): void {
    const root = document.querySelector(this.config.root);
    if (root) {
      (root as HTMLElement).hidden = false;
      this.update();
    }
  }

  get(path: string): unknown {
    const segments = path.split('.');
    let value: unknown = this.state;
    for (const key of segments) {
      if (value === null || value === undefined) return undefined;
      value = (value as Record<string, unknown>)[key];
    }
    return value;
  }

  set(path: string, value: unknown): void {
    const segments = path.split('.');
    const last = segments.pop()!;
    let current: Record<string, unknown> = this.state;

    for (const key of segments) {
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    current[last] = value;
    this.update();
  }

  update(): void {
    document.querySelectorAll('[data-bind]').forEach(el => {
      const path = el.getAttribute('data-bind')!;
      const value = this.get(path);
      el.textContent = value !== undefined ? String(value) : '';
    });
  }

  route(name: string): void {
    const root = document.querySelector(this.config.root);
    if (root) {
      const routeConfig = this._routes[name];
      const title = routeConfig && typeof routeConfig === 'object' && 'title' in routeConfig
        ? String((routeConfig as Record<string, unknown>).title)
        : name;
      root.innerHTML = `<h2>${title}</h2>`;
      this.update();
    }
  }

  onReady(callback: () => void): void {
    this.readyCallbacks.push(callback);
  }
}

export default {
  createSplashRuntime,
  boot,
  AtomicApp,
};
