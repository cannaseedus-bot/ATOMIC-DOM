/**
 * ANSI Terminal Projection Renderer
 * Renders ASXR blocks to ANSI-formatted terminal output
 */

import type { DomNode, Block } from '../runtime/index.js';

// ANSI escape codes
export const ANSI = {
  // Reset
  RESET: '\x1b[0m',

  // Styles
  BOLD: '\x1b[1m',
  DIM: '\x1b[2m',
  ITALIC: '\x1b[3m',
  UNDERLINE: '\x1b[4m',
  BLINK: '\x1b[5m',
  REVERSE: '\x1b[7m',
  HIDDEN: '\x1b[8m',
  STRIKETHROUGH: '\x1b[9m',

  // Foreground colors
  FG_BLACK: '\x1b[30m',
  FG_RED: '\x1b[31m',
  FG_GREEN: '\x1b[32m',
  FG_YELLOW: '\x1b[33m',
  FG_BLUE: '\x1b[34m',
  FG_MAGENTA: '\x1b[35m',
  FG_CYAN: '\x1b[36m',
  FG_WHITE: '\x1b[37m',
  FG_DEFAULT: '\x1b[39m',

  // Bright foreground colors
  FG_BRIGHT_BLACK: '\x1b[90m',
  FG_BRIGHT_RED: '\x1b[91m',
  FG_BRIGHT_GREEN: '\x1b[92m',
  FG_BRIGHT_YELLOW: '\x1b[93m',
  FG_BRIGHT_BLUE: '\x1b[94m',
  FG_BRIGHT_MAGENTA: '\x1b[95m',
  FG_BRIGHT_CYAN: '\x1b[96m',
  FG_BRIGHT_WHITE: '\x1b[97m',

  // Background colors
  BG_BLACK: '\x1b[40m',
  BG_RED: '\x1b[41m',
  BG_GREEN: '\x1b[42m',
  BG_YELLOW: '\x1b[43m',
  BG_BLUE: '\x1b[44m',
  BG_MAGENTA: '\x1b[45m',
  BG_CYAN: '\x1b[46m',
  BG_WHITE: '\x1b[47m',
  BG_DEFAULT: '\x1b[49m',

  // Cursor
  CURSOR_UP: (n: number) => `\x1b[${n}A`,
  CURSOR_DOWN: (n: number) => `\x1b[${n}B`,
  CURSOR_FORWARD: (n: number) => `\x1b[${n}C`,
  CURSOR_BACK: (n: number) => `\x1b[${n}D`,
  CURSOR_POS: (row: number, col: number) => `\x1b[${row};${col}H`,
  CURSOR_HIDE: '\x1b[?25l',
  CURSOR_SHOW: '\x1b[?25h',

  // Screen
  CLEAR_SCREEN: '\x1b[2J',
  CLEAR_LINE: '\x1b[2K',
  CLEAR_TO_END: '\x1b[0J',
};

export interface ANSIRendererOptions {
  /** Terminal width (defaults to 80) */
  width?: number;
  /** Terminal height (defaults to 24) */
  height?: number;
  /** Enable colors */
  colors?: boolean;
  /** Enable Unicode box-drawing characters */
  unicode?: boolean;
  /** Indent size */
  indent?: number;
}

export interface ANSIStyle {
  color?: string;
  background?: string;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  blink?: boolean;
  reverse?: boolean;
  strikethrough?: boolean;
}

const COLOR_MAP: Record<string, string> = {
  black: ANSI.FG_BLACK,
  red: ANSI.FG_RED,
  green: ANSI.FG_GREEN,
  yellow: ANSI.FG_YELLOW,
  blue: ANSI.FG_BLUE,
  magenta: ANSI.FG_MAGENTA,
  cyan: ANSI.FG_CYAN,
  white: ANSI.FG_WHITE,
  gray: ANSI.FG_BRIGHT_BLACK,
  grey: ANSI.FG_BRIGHT_BLACK,
};

const BG_COLOR_MAP: Record<string, string> = {
  black: ANSI.BG_BLACK,
  red: ANSI.BG_RED,
  green: ANSI.BG_GREEN,
  yellow: ANSI.BG_YELLOW,
  blue: ANSI.BG_BLUE,
  magenta: ANSI.BG_MAGENTA,
  cyan: ANSI.BG_CYAN,
  white: ANSI.BG_WHITE,
};

/**
 * ANSI Terminal Renderer
 */
export class ANSIRenderer {
  private options: Required<ANSIRendererOptions>;
  private buffer: string[] = [];

  constructor(options: ANSIRendererOptions = {}) {
    this.options = {
      width: options.width ?? 80,
      height: options.height ?? 24,
      colors: options.colors ?? true,
      unicode: options.unicode ?? true,
      indent: options.indent ?? 2,
    };
  }

  /**
   * Render a DomNode to ANSI string
   */
  render(node: DomNode, depth: number = 0): string {
    this.buffer = [];
    this.renderNode(node, depth);
    return this.buffer.join('');
  }

  /**
   * Render a Block to ANSI string
   */
  renderBlock(block: Block, depth: number = 0): string {
    const domNode = this.blockToDomNode(block);
    return this.render(domNode, depth);
  }

  private renderNode(node: DomNode, depth: number): void {
    const indent = ' '.repeat(depth * this.options.indent);
    const style = this.extractStyle(node.props);

    switch (node.selector) {
      case 'frame':
      case 'box':
        this.renderBox(node, depth);
        break;

      case 'text':
      case 'span':
        this.renderText(node, style);
        break;

      case 'heading':
      case 'h1':
        this.buffer.push('\n');
        this.buffer.push(indent);
        this.buffer.push(this.applyStyle({ bold: true, ...style }));
        this.buffer.push(this.getText(node).toUpperCase());
        this.buffer.push(ANSI.RESET);
        this.buffer.push('\n');
        break;

      case 'h2':
      case 'h3':
        this.buffer.push('\n');
        this.buffer.push(indent);
        this.buffer.push(this.applyStyle({ bold: true, ...style }));
        this.buffer.push(this.getText(node));
        this.buffer.push(ANSI.RESET);
        this.buffer.push('\n');
        break;

      case 'paragraph':
      case 'p':
        this.buffer.push('\n');
        this.buffer.push(indent);
        this.buffer.push(this.applyStyle(style));
        this.buffer.push(this.wordWrap(this.getText(node), this.options.width - depth * this.options.indent));
        this.buffer.push(ANSI.RESET);
        this.buffer.push('\n');
        break;

      case 'list':
      case 'ul':
        this.buffer.push('\n');
        for (const child of node.children) {
          this.buffer.push(indent);
          this.buffer.push(this.options.unicode ? '  • ' : '  * ');
          this.renderNode(child, depth + 1);
          this.buffer.push('\n');
        }
        break;

      case 'item':
      case 'li':
        this.buffer.push(this.applyStyle(style));
        this.buffer.push(this.getText(node));
        this.buffer.push(ANSI.RESET);
        break;

      case 'divider':
      case 'hr':
        this.buffer.push('\n');
        this.buffer.push(indent);
        this.buffer.push(this.options.unicode ? '─'.repeat(this.options.width - depth * this.options.indent) : '-'.repeat(this.options.width - depth * this.options.indent));
        this.buffer.push('\n');
        break;

      case 'table':
        this.renderTable(node, depth);
        break;

      case 'progress':
        this.renderProgress(node, depth);
        break;

      case 'status':
        this.renderStatus(node, depth);
        break;

      default:
        // Default: render as container
        for (const child of node.children) {
          this.renderNode(child, depth);
        }
        if (node.props.text) {
          this.buffer.push(indent);
          this.buffer.push(this.applyStyle(style));
          this.buffer.push(String(node.props.text));
          this.buffer.push(ANSI.RESET);
        }
    }
  }

  private renderBox(node: DomNode, depth: number): void {
    const indent = ' '.repeat(depth * this.options.indent);
    const width = (node.props.width as number) || this.options.width - depth * this.options.indent;
    const title = node.props.title as string | undefined;

    // Box characters
    const chars = this.options.unicode
      ? { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' }
      : { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' };

    // Top border
    this.buffer.push('\n');
    this.buffer.push(indent);
    this.buffer.push(chars.tl);
    if (title) {
      const titlePart = ` ${title} `;
      const remaining = width - titlePart.length - 2;
      this.buffer.push(chars.h);
      this.buffer.push(ANSI.BOLD);
      this.buffer.push(titlePart);
      this.buffer.push(ANSI.RESET);
      this.buffer.push(chars.h.repeat(remaining));
    } else {
      this.buffer.push(chars.h.repeat(width - 2));
    }
    this.buffer.push(chars.tr);
    this.buffer.push('\n');

    // Content
    for (const child of node.children) {
      this.buffer.push(indent);
      this.buffer.push(chars.v);
      this.buffer.push(' ');

      const contentStart = this.buffer.length;
      this.renderNode(child, 0);
      const content = this.buffer.slice(contentStart).join('');
      this.buffer.length = contentStart;

      // Pad content to width
      const visibleLength = this.stripAnsi(content).length;
      const padding = width - visibleLength - 4;
      this.buffer.push(content);
      this.buffer.push(' '.repeat(Math.max(0, padding)));
      this.buffer.push(' ');
      this.buffer.push(chars.v);
      this.buffer.push('\n');
    }

    // Bottom border
    this.buffer.push(indent);
    this.buffer.push(chars.bl);
    this.buffer.push(chars.h.repeat(width - 2));
    this.buffer.push(chars.br);
    this.buffer.push('\n');
  }

  private renderTable(node: DomNode, depth: number): void {
    const indent = ' '.repeat(depth * this.options.indent);
    const rows = node.children;
    if (rows.length === 0) return;

    // Calculate column widths
    const colWidths: number[] = [];
    for (const row of rows) {
      const cells = row.children;
      for (let i = 0; i < cells.length; i++) {
        const text = this.getText(cells[i]);
        colWidths[i] = Math.max(colWidths[i] || 0, text.length);
      }
    }

    const chars = this.options.unicode
      ? { h: '─', v: '│', cross: '┼', tl: '┌', tr: '┐', bl: '└', br: '┘', tm: '┬', bm: '┴', lm: '├', rm: '┤' }
      : { h: '-', v: '|', cross: '+', tl: '+', tr: '+', bl: '+', br: '+', tm: '+', bm: '+', lm: '+', rm: '+' };

    // Top border
    this.buffer.push('\n');
    this.buffer.push(indent);
    this.buffer.push(chars.tl);
    this.buffer.push(colWidths.map(w => chars.h.repeat(w + 2)).join(chars.tm));
    this.buffer.push(chars.tr);
    this.buffer.push('\n');

    // Rows
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri];
      const cells = row.children;

      this.buffer.push(indent);
      this.buffer.push(chars.v);
      for (let ci = 0; ci < colWidths.length; ci++) {
        const text = ci < cells.length ? this.getText(cells[ci]) : '';
        this.buffer.push(' ');
        this.buffer.push(text.padEnd(colWidths[ci]));
        this.buffer.push(' ');
        this.buffer.push(chars.v);
      }
      this.buffer.push('\n');

      // Header separator
      if (ri === 0 && rows.length > 1) {
        this.buffer.push(indent);
        this.buffer.push(chars.lm);
        this.buffer.push(colWidths.map(w => chars.h.repeat(w + 2)).join(chars.cross));
        this.buffer.push(chars.rm);
        this.buffer.push('\n');
      }
    }

    // Bottom border
    this.buffer.push(indent);
    this.buffer.push(chars.bl);
    this.buffer.push(colWidths.map(w => chars.h.repeat(w + 2)).join(chars.bm));
    this.buffer.push(chars.br);
    this.buffer.push('\n');
  }

  private renderProgress(node: DomNode, depth: number): void {
    const indent = ' '.repeat(depth * this.options.indent);
    const value = (node.props.value as number) || 0;
    const max = (node.props.max as number) || 100;
    const width = (node.props.width as number) || 20;
    const label = node.props.label as string | undefined;

    const percent = Math.min(100, Math.max(0, (value / max) * 100));
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;

    const chars = this.options.unicode
      ? { filled: '█', empty: '░' }
      : { filled: '#', empty: '-' };

    this.buffer.push(indent);
    if (label) {
      this.buffer.push(label);
      this.buffer.push(' ');
    }
    this.buffer.push('[');
    this.buffer.push(ANSI.FG_GREEN);
    this.buffer.push(chars.filled.repeat(filled));
    this.buffer.push(ANSI.RESET);
    this.buffer.push(chars.empty.repeat(empty));
    this.buffer.push(']');
    this.buffer.push(` ${Math.round(percent)}%`);
    this.buffer.push('\n');
  }

  private renderStatus(node: DomNode, depth: number): void {
    const indent = ' '.repeat(depth * this.options.indent);
    const type = (node.props.type as string) || 'info';
    const text = this.getText(node);

    const icons: Record<string, { icon: string; color: string }> = {
      success: { icon: this.options.unicode ? '✓' : '[OK]', color: ANSI.FG_GREEN },
      error: { icon: this.options.unicode ? '✗' : '[ERR]', color: ANSI.FG_RED },
      warning: { icon: this.options.unicode ? '⚠' : '[WARN]', color: ANSI.FG_YELLOW },
      info: { icon: this.options.unicode ? 'ℹ' : '[INFO]', color: ANSI.FG_BLUE },
    };

    const { icon, color } = icons[type] || icons.info;

    this.buffer.push(indent);
    this.buffer.push(color);
    this.buffer.push(icon);
    this.buffer.push(ANSI.RESET);
    this.buffer.push(' ');
    this.buffer.push(text);
    this.buffer.push('\n');
  }

  private renderText(node: DomNode, style: ANSIStyle): void {
    this.buffer.push(this.applyStyle(style));
    this.buffer.push(this.getText(node));
    this.buffer.push(ANSI.RESET);
  }

  private extractStyle(props: Record<string, unknown>): ANSIStyle {
    const style: ANSIStyle = {};

    if (props.color && typeof props.color === 'string') {
      style.color = props.color;
    }
    if (props.background && typeof props.background === 'string') {
      style.background = props.background;
    }
    if (props.bold) style.bold = true;
    if (props.dim) style.dim = true;
    if (props.italic) style.italic = true;
    if (props.underline) style.underline = true;

    return style;
  }

  private applyStyle(style: ANSIStyle): string {
    if (!this.options.colors) return '';

    const codes: string[] = [];

    if (style.bold) codes.push(ANSI.BOLD);
    if (style.dim) codes.push(ANSI.DIM);
    if (style.italic) codes.push(ANSI.ITALIC);
    if (style.underline) codes.push(ANSI.UNDERLINE);
    if (style.blink) codes.push(ANSI.BLINK);
    if (style.reverse) codes.push(ANSI.REVERSE);
    if (style.strikethrough) codes.push(ANSI.STRIKETHROUGH);

    if (style.color && COLOR_MAP[style.color]) {
      codes.push(COLOR_MAP[style.color]);
    }
    if (style.background && BG_COLOR_MAP[style.background]) {
      codes.push(BG_COLOR_MAP[style.background]);
    }

    return codes.join('');
  }

  private getText(node: DomNode): string {
    if (typeof node.props.text === 'string') {
      return node.props.text;
    }
    // Recursively get text from children
    return node.children.map(c => this.getText(c)).join('');
  }

  private wordWrap(text: string, width: number): string {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines.join('\n');
  }

  private stripAnsi(str: string): string {
    return str.replace(/\x1b\[[0-9;]*m/g, '');
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
 * Create an ANSI renderer
 */
export function createANSIRenderer(options?: ANSIRendererOptions): ANSIRenderer {
  return new ANSIRenderer(options);
}
