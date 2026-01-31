/**
 * DOM Projection Renderer
 * Renders ASXR blocks to DOM elements
 */

import type { DomNode, Block } from '../runtime/index.js';

export interface DOMRendererOptions {
  /** Target document (defaults to global document) */
  document?: Document;
  /** Create elements in a namespace (for SVG, etc.) */
  namespace?: string;
  /** Apply styles inline vs class-based */
  inlineStyles?: boolean;
  /** Event delegation root */
  eventRoot?: Element;
}

export interface RenderResult {
  element: Element;
  cleanup: () => void;
}

/**
 * DOM Projection Renderer
 */
export class DOMRenderer {
  private doc: Document;
  private options: DOMRendererOptions;
  private eventHandlers: Map<Element, Map<string, EventListener>> = new Map();
  private mounted: Set<Element> = new Set();

  constructor(options: DOMRendererOptions = {}) {
    this.options = options;
    this.doc = options.document || (typeof document !== 'undefined' ? document : null as unknown as Document);
  }

  /**
   * Render a DomNode to a DOM Element
   */
  render(node: DomNode): RenderResult {
    const element = this.createElement(node);
    this.mounted.add(element);

    return {
      element,
      cleanup: () => this.unmount(element),
    };
  }

  /**
   * Render and mount to a container
   */
  mount(node: DomNode, container: Element | string): RenderResult {
    const target = typeof container === 'string'
      ? this.doc.querySelector(container)
      : container;

    if (!target) {
      throw new Error(`Container not found: ${container}`);
    }

    const result = this.render(node);
    target.appendChild(result.element);

    return result;
  }

  /**
   * Render a Block (converts to DomNode first)
   */
  renderBlock(block: Block): RenderResult {
    const domNode = this.blockToDomNode(block);
    return this.render(domNode);
  }

  /**
   * Create a DOM element from a DomNode
   */
  private createElement(node: DomNode): Element {
    // Determine element type from selector
    const tagName = this.getTagName(node.selector);

    // Create element
    const element = this.options.namespace
      ? this.doc.createElementNS(this.options.namespace, tagName)
      : this.doc.createElement(tagName);

    // Set ID if present
    if (node.id) {
      const id = node.id.startsWith('#') ? node.id.slice(1) : node.id;
      element.id = id;
    }

    // Apply properties
    this.applyProps(element, node.props);

    // Render children
    for (const child of node.children) {
      const childElement = this.createElement(child);
      element.appendChild(childElement);
    }

    return element;
  }

  /**
   * Apply properties to an element
   */
  private applyProps(element: Element, props: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(props)) {
      if (key === 'text' && typeof value === 'string') {
        element.textContent = value;
      } else if (key === 'html' && typeof value === 'string') {
        element.innerHTML = value;
      } else if (key === 'style' && typeof value === 'object') {
        this.applyStyles(element as HTMLElement, value as Record<string, string>);
      } else if (key === 'class' || key === 'className') {
        if (typeof value === 'string') {
          element.className = value;
        } else if (Array.isArray(value)) {
          element.className = value.join(' ');
        }
      } else if (key === 'attrs' && typeof value === 'object') {
        for (const [attr, attrValue] of Object.entries(value as Record<string, string>)) {
          element.setAttribute(attr, String(attrValue));
        }
      } else if (key === 'events' && typeof value === 'object') {
        this.applyEvents(element, value as Record<string, EventListener>);
      } else if (key === 'data' && typeof value === 'object') {
        for (const [dataKey, dataValue] of Object.entries(value as Record<string, string>)) {
          (element as HTMLElement).dataset[dataKey] = String(dataValue);
        }
      } else if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase();
        this.addEventListener(element, eventName, value as EventListener);
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        element.setAttribute(key, String(value));
      }
    }
  }

  /**
   * Apply inline styles
   */
  private applyStyles(element: HTMLElement, styles: Record<string, string>): void {
    for (const [prop, value] of Object.entries(styles)) {
      // Convert camelCase to kebab-case
      const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
      element.style.setProperty(cssProp, value);
    }
  }

  /**
   * Apply event listeners
   */
  private applyEvents(element: Element, events: Record<string, EventListener>): void {
    for (const [eventName, handler] of Object.entries(events)) {
      this.addEventListener(element, eventName, handler);
    }
  }

  /**
   * Add an event listener with tracking
   */
  private addEventListener(element: Element, event: string, handler: EventListener): void {
    element.addEventListener(event, handler);

    if (!this.eventHandlers.has(element)) {
      this.eventHandlers.set(element, new Map());
    }
    this.eventHandlers.get(element)!.set(event, handler);
  }

  /**
   * Remove all event listeners from an element
   */
  private removeEventListeners(element: Element): void {
    const handlers = this.eventHandlers.get(element);
    if (handlers) {
      for (const [event, handler] of handlers) {
        element.removeEventListener(event, handler);
      }
      this.eventHandlers.delete(element);
    }
  }

  /**
   * Unmount and cleanup an element
   */
  private unmount(element: Element): void {
    // Remove event listeners
    this.removeEventListeners(element);

    // Cleanup children
    for (const child of Array.from(element.children)) {
      this.unmount(child);
    }

    // Remove from DOM
    element.remove();
    this.mounted.delete(element);
  }

  /**
   * Get HTML tag name from selector
   */
  private getTagName(selector: string): string {
    // Handle common selector types
    if (selector === 'frame' || selector === 'root') return 'div';
    if (selector === 'element') return 'div';
    if (selector === 'component') return 'div';
    if (selector === 'text') return 'span';
    if (selector === 'input') return 'input';
    if (selector === 'button') return 'button';
    if (selector === 'link') return 'a';
    if (selector === 'image') return 'img';
    if (selector === 'list') return 'ul';
    if (selector === 'item') return 'li';

    // Otherwise use selector as tag name
    return selector;
  }

  /**
   * Convert a Block to a DomNode
   */
  private blockToDomNode(block: Block): DomNode {
    const props: Record<string, unknown> = { ...block.props };
    const children: DomNode[] = [];

    // Extract children if present
    if (Array.isArray(props.children)) {
      for (const child of props.children) {
        if (this.isDomNode(child)) {
          children.push(child);
        }
      }
      delete props.children;
    }

    return {
      selector: block.type,
      id: block.id,
      props,
      children,
    };
  }

  /**
   * Check if value is a DomNode
   */
  private isDomNode(value: unknown): value is DomNode {
    return (
      typeof value === 'object' &&
      value !== null &&
      'selector' in value &&
      typeof (value as DomNode).selector === 'string'
    );
  }

  /**
   * Update an existing element with new props
   */
  update(element: Element, node: DomNode): void {
    // Clear existing content
    element.textContent = '';

    // Re-apply props
    this.applyProps(element, node.props);

    // Re-render children
    for (const child of node.children) {
      const childElement = this.createElement(child);
      element.appendChild(childElement);
    }
  }

  /**
   * Diff and patch - minimal updates
   */
  patch(oldNode: DomNode, newNode: DomNode, element: Element): void {
    // Simple prop diffing
    const oldProps = oldNode.props;
    const newProps = newNode.props;

    // Remove old props not in new
    for (const key of Object.keys(oldProps)) {
      if (!(key in newProps)) {
        element.removeAttribute(key);
      }
    }

    // Apply new/changed props
    for (const [key, value] of Object.entries(newProps)) {
      if (oldProps[key] !== value) {
        if (key === 'text') {
          element.textContent = String(value);
        } else if (typeof value === 'string') {
          element.setAttribute(key, value);
        }
      }
    }

    // Reconcile children (simplified - full reconciliation would use keys)
    const oldChildren = oldNode.children;
    const newChildren = newNode.children;
    const childElements = Array.from(element.children);

    for (let i = 0; i < Math.max(oldChildren.length, newChildren.length); i++) {
      if (i >= newChildren.length) {
        // Remove extra children
        if (childElements[i]) {
          this.unmount(childElements[i]);
        }
      } else if (i >= oldChildren.length) {
        // Add new children
        const childElement = this.createElement(newChildren[i]);
        element.appendChild(childElement);
      } else {
        // Patch existing children
        this.patch(oldChildren[i], newChildren[i], childElements[i]);
      }
    }
  }
}

/**
 * Create a DOM renderer
 */
export function createDOMRenderer(options?: DOMRendererOptions): DOMRenderer {
  return new DOMRenderer(options);
}

/**
 * Render to HTML string (for SSR)
 */
export function renderToString(node: DomNode): string {
  const tagName = getTagNameFromSelector(node.selector);
  const attrs = propsToAttributes(node.props);
  const id = node.id ? ` id="${node.id.replace('#', '')}"` : '';

  // Self-closing tags
  const selfClosing = ['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tagName);

  if (selfClosing) {
    return `<${tagName}${id}${attrs} />`;
  }

  // Get text content
  const text = typeof node.props.text === 'string' ? escapeHtml(node.props.text) : '';

  // Render children
  const children = node.children.map(renderToString).join('');

  return `<${tagName}${id}${attrs}>${text}${children}</${tagName}>`;
}

function getTagNameFromSelector(selector: string): string {
  if (selector === 'frame' || selector === 'root' || selector === 'element' || selector === 'component') return 'div';
  if (selector === 'text') return 'span';
  return selector;
}

function propsToAttributes(props: Record<string, unknown>): string {
  const attrs: string[] = [];

  for (const [key, value] of Object.entries(props)) {
    if (key === 'text' || key === 'html' || key === 'children' || key === 'events') continue;

    if (key === 'class' || key === 'className') {
      const classValue = Array.isArray(value) ? value.join(' ') : String(value);
      attrs.push(`class="${escapeHtml(classValue)}"`);
    } else if (key === 'style' && typeof value === 'object') {
      const styleStr = Object.entries(value as Record<string, string>)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`)
        .join(';');
      attrs.push(`style="${escapeHtml(styleStr)}"`);
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      if (typeof value === 'boolean') {
        if (value) attrs.push(key);
      } else {
        attrs.push(`${key}="${escapeHtml(String(value))}"`);
      }
    }
  }

  return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
