/**
 * SVG Projection Renderer
 * Renders ASXR blocks to SVG elements
 */

import type { DomNode, Block } from '../runtime/index.js';

export interface SVGRendererOptions {
  /** SVG width */
  width?: number;
  /** SVG height */
  height?: number;
  /** SVG viewBox */
  viewBox?: string;
  /** Default styles */
  defaultStyles?: Record<string, string>;
  /** Namespace for custom elements */
  namespace?: string;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * SVG Renderer
 */
export class SVGRenderer {
  private options: Required<SVGRendererOptions>;

  constructor(options: SVGRendererOptions = {}) {
    this.options = {
      width: options.width ?? 800,
      height: options.height ?? 600,
      viewBox: options.viewBox ?? `0 0 ${options.width ?? 800} ${options.height ?? 600}`,
      defaultStyles: options.defaultStyles ?? {},
      namespace: options.namespace ?? SVG_NS,
    };
  }

  /**
   * Render a DomNode to SVG string
   */
  render(node: DomNode): string {
    const children = this.renderNode(node);
    return this.wrapSVG(children);
  }

  /**
   * Render a Block to SVG string
   */
  renderBlock(block: Block): string {
    const domNode = this.blockToDomNode(block);
    return this.render(domNode);
  }

  /**
   * Wrap content in SVG root element
   */
  private wrapSVG(content: string): string {
    return `<svg xmlns="${SVG_NS}" width="${this.options.width}" height="${this.options.height}" viewBox="${this.options.viewBox}">
${content}
</svg>`;
  }

  /**
   * Render a node to SVG
   */
  private renderNode(node: DomNode, depth: number = 0): string {
    const indent = '  '.repeat(depth);

    switch (node.selector) {
      case 'rect':
      case 'rectangle':
        return this.renderRect(node, indent);

      case 'circle':
        return this.renderCircle(node, indent);

      case 'ellipse':
        return this.renderEllipse(node, indent);

      case 'line':
        return this.renderLine(node, indent);

      case 'polyline':
        return this.renderPolyline(node, indent);

      case 'polygon':
        return this.renderPolygon(node, indent);

      case 'path':
        return this.renderPath(node, indent);

      case 'text':
        return this.renderText(node, indent);

      case 'group':
      case 'g':
        return this.renderGroup(node, indent, depth);

      case 'image':
        return this.renderImage(node, indent);

      case 'use':
        return this.renderUse(node, indent);

      case 'defs':
        return this.renderDefs(node, indent, depth);

      case 'linearGradient':
        return this.renderLinearGradient(node, indent, depth);

      case 'radialGradient':
        return this.renderRadialGradient(node, indent, depth);

      case 'clipPath':
        return this.renderClipPath(node, indent, depth);

      case 'mask':
        return this.renderMask(node, indent, depth);

      case 'filter':
        return this.renderFilter(node, indent, depth);

      case 'animate':
        return this.renderAnimate(node, indent);

      case 'svg':
      case 'frame':
      case 'root':
        return this.renderChildren(node, depth);

      default:
        // Generic element
        return this.renderGenericElement(node, indent, depth);
    }
  }

  private renderRect(node: DomNode, indent: string): string {
    const attrs = this.buildAttributes({
      x: node.props.x ?? 0,
      y: node.props.y ?? 0,
      width: node.props.width ?? 100,
      height: node.props.height ?? 100,
      rx: node.props.rx,
      ry: node.props.ry,
      ...this.extractStyleAttrs(node.props),
    });
    return `${indent}<rect${attrs}/>`;
  }

  private renderCircle(node: DomNode, indent: string): string {
    const attrs = this.buildAttributes({
      cx: node.props.cx ?? node.props.x ?? 50,
      cy: node.props.cy ?? node.props.y ?? 50,
      r: node.props.r ?? node.props.radius ?? 50,
      ...this.extractStyleAttrs(node.props),
    });
    return `${indent}<circle${attrs}/>`;
  }

  private renderEllipse(node: DomNode, indent: string): string {
    const attrs = this.buildAttributes({
      cx: node.props.cx ?? node.props.x ?? 50,
      cy: node.props.cy ?? node.props.y ?? 50,
      rx: node.props.rx ?? node.props.radiusX ?? 50,
      ry: node.props.ry ?? node.props.radiusY ?? 30,
      ...this.extractStyleAttrs(node.props),
    });
    return `${indent}<ellipse${attrs}/>`;
  }

  private renderLine(node: DomNode, indent: string): string {
    const attrs = this.buildAttributes({
      x1: node.props.x1 ?? 0,
      y1: node.props.y1 ?? 0,
      x2: node.props.x2 ?? 100,
      y2: node.props.y2 ?? 100,
      ...this.extractStyleAttrs(node.props),
    });
    return `${indent}<line${attrs}/>`;
  }

  private renderPolyline(node: DomNode, indent: string): string {
    const points = this.formatPoints(node.props.points);
    const attrs = this.buildAttributes({
      points,
      ...this.extractStyleAttrs(node.props),
    });
    return `${indent}<polyline${attrs}/>`;
  }

  private renderPolygon(node: DomNode, indent: string): string {
    const points = this.formatPoints(node.props.points);
    const attrs = this.buildAttributes({
      points,
      ...this.extractStyleAttrs(node.props),
    });
    return `${indent}<polygon${attrs}/>`;
  }

  private renderPath(node: DomNode, indent: string): string {
    const d = typeof node.props.d === 'string' ? node.props.d : '';
    const attrs = this.buildAttributes({
      d,
      ...this.extractStyleAttrs(node.props),
    });
    return `${indent}<path${attrs}/>`;
  }

  private renderText(node: DomNode, indent: string): string {
    const text = typeof node.props.text === 'string' ? this.escapeXml(node.props.text) : '';
    const attrs = this.buildAttributes({
      x: node.props.x ?? 0,
      y: node.props.y ?? 0,
      'text-anchor': node.props.textAnchor ?? node.props.anchor,
      'dominant-baseline': node.props.baseline,
      'font-family': node.props.fontFamily ?? node.props.font,
      'font-size': node.props.fontSize ?? node.props.size,
      'font-weight': node.props.fontWeight ?? node.props.weight,
      ...this.extractStyleAttrs(node.props),
    });
    return `${indent}<text${attrs}>${text}</text>`;
  }

  private renderGroup(node: DomNode, indent: string, depth: number): string {
    const attrs = this.buildAttributes({
      id: node.id?.replace('#', ''),
      transform: node.props.transform,
      ...this.extractStyleAttrs(node.props),
    });
    const children = this.renderChildren(node, depth + 1);
    return `${indent}<g${attrs}>\n${children}\n${indent}</g>`;
  }

  private renderImage(node: DomNode, indent: string): string {
    const href = node.props.href ?? node.props.src ?? '';
    const attrs = this.buildAttributes({
      href,
      x: node.props.x ?? 0,
      y: node.props.y ?? 0,
      width: node.props.width,
      height: node.props.height,
      preserveAspectRatio: node.props.preserveAspectRatio,
    });
    return `${indent}<image${attrs}/>`;
  }

  private renderUse(node: DomNode, indent: string): string {
    const href = node.props.href ?? `#${node.props.ref}`;
    const attrs = this.buildAttributes({
      href,
      x: node.props.x,
      y: node.props.y,
      width: node.props.width,
      height: node.props.height,
    });
    return `${indent}<use${attrs}/>`;
  }

  private renderDefs(node: DomNode, indent: string, depth: number): string {
    const children = this.renderChildren(node, depth + 1);
    return `${indent}<defs>\n${children}\n${indent}</defs>`;
  }

  private renderLinearGradient(node: DomNode, indent: string, _depth: number): string {
    const id = node.id?.replace('#', '') ?? node.props.id;
    const attrs = this.buildAttributes({
      id,
      x1: node.props.x1 ?? '0%',
      y1: node.props.y1 ?? '0%',
      x2: node.props.x2 ?? '100%',
      y2: node.props.y2 ?? '0%',
      gradientUnits: node.props.gradientUnits,
    });
    const stops = this.renderStops(node.props.stops);
    return `${indent}<linearGradient${attrs}>\n${stops}\n${indent}</linearGradient>`;
  }

  private renderRadialGradient(node: DomNode, indent: string, _depth: number): string {
    const id = node.id?.replace('#', '') ?? node.props.id;
    const attrs = this.buildAttributes({
      id,
      cx: node.props.cx ?? '50%',
      cy: node.props.cy ?? '50%',
      r: node.props.r ?? '50%',
      fx: node.props.fx,
      fy: node.props.fy,
      gradientUnits: node.props.gradientUnits,
    });
    const stops = this.renderStops(node.props.stops);
    return `${indent}<radialGradient${attrs}>\n${stops}\n${indent}</radialGradient>`;
  }

  private renderStops(stops: unknown): string {
    if (!Array.isArray(stops)) return '';
    return stops
      .map((stop: unknown) => {
        if (typeof stop !== 'object' || stop === null) return '';
        const s = stop as { offset?: string | number; color?: string; opacity?: number };
        const attrs = this.buildAttributes({
          offset: s.offset,
          'stop-color': s.color,
          'stop-opacity': s.opacity,
        });
        return `    <stop${attrs}/>`;
      })
      .join('\n');
  }

  private renderClipPath(node: DomNode, indent: string, depth: number): string {
    const id = node.id?.replace('#', '') ?? node.props.id;
    const children = this.renderChildren(node, depth + 1);
    return `${indent}<clipPath id="${id}">\n${children}\n${indent}</clipPath>`;
  }

  private renderMask(node: DomNode, indent: string, depth: number): string {
    const id = node.id?.replace('#', '') ?? node.props.id;
    const children = this.renderChildren(node, depth + 1);
    return `${indent}<mask id="${id}">\n${children}\n${indent}</mask>`;
  }

  private renderFilter(node: DomNode, indent: string, depth: number): string {
    const id = node.id?.replace('#', '') ?? node.props.id;
    const children = this.renderChildren(node, depth + 1);
    return `${indent}<filter id="${id}">\n${children}\n${indent}</filter>`;
  }

  private renderAnimate(node: DomNode, indent: string): string {
    const attrs = this.buildAttributes({
      attributeName: node.props.attributeName ?? node.props.attr,
      from: node.props.from,
      to: node.props.to,
      dur: node.props.dur ?? node.props.duration,
      repeatCount: node.props.repeatCount ?? node.props.repeat,
      fill: node.props.fill,
    });
    return `${indent}<animate${attrs}/>`;
  }

  private renderGenericElement(node: DomNode, indent: string, depth: number): string {
    const tagName = node.selector;
    const attrs = this.buildAttributes({
      id: node.id?.replace('#', ''),
      ...this.extractStyleAttrs(node.props),
    });

    if (node.children.length === 0 && !node.props.text) {
      return `${indent}<${tagName}${attrs}/>`;
    }

    const text = typeof node.props.text === 'string' ? this.escapeXml(node.props.text) : '';
    const children = this.renderChildren(node, depth + 1);
    const content = text + (children ? '\n' + children + '\n' + indent : '');
    return `${indent}<${tagName}${attrs}>${content}</${tagName}>`;
  }

  private renderChildren(node: DomNode, depth: number): string {
    return node.children.map(child => this.renderNode(child, depth)).join('\n');
  }

  private extractStyleAttrs(props: Record<string, unknown>): Record<string, unknown> {
    const styleAttrs: Record<string, unknown> = {};

    // Common SVG style attributes
    const styleKeys = [
      'fill', 'stroke', 'stroke-width', 'strokeWidth',
      'opacity', 'fill-opacity', 'fillOpacity',
      'stroke-opacity', 'strokeOpacity',
      'stroke-linecap', 'strokeLinecap',
      'stroke-linejoin', 'strokeLinejoin',
      'stroke-dasharray', 'strokeDasharray',
      'transform', 'class', 'className', 'style',
    ];

    for (const key of styleKeys) {
      if (key in props) {
        // Convert camelCase to kebab-case for SVG
        const svgKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        styleAttrs[svgKey] = props[key];
      }
    }

    return styleAttrs;
  }

  private buildAttributes(attrs: Record<string, unknown>): string {
    const parts: string[] = [];

    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === null) continue;

      if (typeof value === 'string' || typeof value === 'number') {
        parts.push(`${key}="${this.escapeXml(String(value))}"`);
      } else if (typeof value === 'boolean' && value) {
        parts.push(key);
      }
    }

    return parts.length > 0 ? ' ' + parts.join(' ') : '';
  }

  private formatPoints(points: unknown): string {
    if (typeof points === 'string') return points;
    if (Array.isArray(points)) {
      return points
        .map(p => {
          if (Array.isArray(p)) return p.join(',');
          if (typeof p === 'object' && p !== null) {
            const pt = p as { x?: number; y?: number };
            return `${pt.x ?? 0},${pt.y ?? 0}`;
          }
          return String(p);
        })
        .join(' ');
    }
    return '';
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private blockToDomNode(block: Block): DomNode {
    const props: Record<string, unknown> = { ...block.props };
    const children: DomNode[] = [];

    if (Array.isArray(props.children)) {
      for (const child of props.children) {
        if (typeof child === 'object' && child !== null && 'selector' in child) {
          children.push(child as DomNode);
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
}

/**
 * Create an SVG renderer
 */
export function createSVGRenderer(options?: SVGRendererOptions): SVGRenderer {
  return new SVGRenderer(options);
}

/**
 * Helper: Create a simple chart
 */
export function createBarChart(
  data: { label: string; value: number }[],
  options: { width?: number; height?: number; barColor?: string; labelColor?: string } = {}
): DomNode {
  const width = options.width ?? 400;
  const height = options.height ?? 300;
  const barColor = options.barColor ?? '#4299e1';
  const labelColor = options.labelColor ?? '#333';

  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = (width - 60) / data.length - 10;
  const chartHeight = height - 60;

  const bars: DomNode[] = data.map((d, i) => {
    const barHeight = (d.value / maxValue) * chartHeight;
    const x = 50 + i * (barWidth + 10);
    const y = height - 40 - barHeight;

    return {
      selector: 'g',
      id: null,
      props: {},
      children: [
        {
          selector: 'rect',
          id: null,
          props: {
            x,
            y,
            width: barWidth,
            height: barHeight,
            fill: barColor,
          },
          children: [],
        },
        {
          selector: 'text',
          id: null,
          props: {
            x: x + barWidth / 2,
            y: height - 20,
            textAnchor: 'middle',
            fontSize: 12,
            fill: labelColor,
            text: d.label,
          },
          children: [],
        },
        {
          selector: 'text',
          id: null,
          props: {
            x: x + barWidth / 2,
            y: y - 5,
            textAnchor: 'middle',
            fontSize: 10,
            fill: labelColor,
            text: String(d.value),
          },
          children: [],
        },
      ],
    };
  });

  return {
    selector: 'svg',
    id: null,
    props: { width, height },
    children: bars,
  };
}
