/**
 * ASXR Projection System
 * Renders ASXR blocks to various output targets
 */

// DOM Projection
export {
  DOMRenderer,
  createDOMRenderer,
  renderToString,
  type DOMRendererOptions,
  type RenderResult,
} from './dom.js';

// ANSI Terminal Projection
export {
  ANSIRenderer,
  createANSIRenderer,
  ANSI,
  type ANSIRendererOptions,
  type ANSIStyle,
} from './ansi.js';

// SVG Projection
export {
  SVGRenderer,
  createSVGRenderer,
  createBarChart,
  type SVGRendererOptions,
} from './svg.js';

import type { DomNode, Block } from '../runtime/index.js';
import { renderToString as _renderToString } from './dom.js';
import { createANSIRenderer as _createANSIRenderer } from './ansi.js';
import { createSVGRenderer as _createSVGRenderer } from './svg.js';

/**
 * Projection target types
 */
export type ProjectionTarget = 'dom' | 'ansi' | 'svg' | 'html';

/**
 * Unified projection options
 */
export interface ProjectOptions {
  target: ProjectionTarget;
  dom?: import('./dom.js').DOMRendererOptions;
  ansi?: import('./ansi.js').ANSIRendererOptions;
  svg?: import('./svg.js').SVGRendererOptions;
}

/**
 * Project a node to the specified target
 */
export function project(node: DomNode | Block, options: ProjectOptions): string {
  const domNode = isDomNode(node) ? node : blockToDomNode(node);

  switch (options.target) {
    case 'dom':
    case 'html':
      return _renderToString(domNode);

    case 'ansi': {
      const ansiRenderer = _createANSIRenderer(options.ansi);
      return ansiRenderer.render(domNode);
    }

    case 'svg': {
      const svgRenderer = _createSVGRenderer(options.svg);
      return svgRenderer.render(domNode);
    }

    default:
      throw new Error(`Unknown projection target: ${options.target}`);
  }
}

function isDomNode(value: unknown): value is DomNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'selector' in value &&
    typeof (value as DomNode).selector === 'string'
  );
}

function blockToDomNode(block: Block): DomNode {
  const props: Record<string, unknown> = { ...block.props };
  const children: DomNode[] = [];

  if (Array.isArray(props.children)) {
    for (const child of props.children) {
      if (isDomNode(child)) {
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
