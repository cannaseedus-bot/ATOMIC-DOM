/**
 * ASXR Lexer
 * Tokenizes ASXR source code according to the grammar specification
 */

import {
  Token,
  TokenType,
  Position,
  createToken,
} from './tokens.js';

export class Lexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(source: string) {
    this.source = source;
  }

  /**
   * Tokenize the entire source
   */
  tokenize(): Token[] {
    this.tokens = [];
    this.pos = 0;
    this.line = 1;
    this.column = 1;

    while (!this.isAtEnd()) {
      const token = this.scanToken();
      if (token) {
        // Skip comments and whitespace (except newlines which may be significant)
        if (token.type !== TokenType.COMMENT) {
          this.tokens.push(token);
        }
      }
    }

    this.tokens.push(
      createToken(TokenType.EOF, '', this.position(), this.position())
    );

    return this.tokens;
  }

  private scanToken(): Token | null {
    this.skipWhitespace();

    if (this.isAtEnd()) return null;

    const start = this.position();
    const char = this.peek();

    // Section separator ---
    if (char === '-' && this.peekAhead(1) === '-' && this.peekAhead(2) === '-') {
      this.advance();
      this.advance();
      this.advance();
      return createToken(TokenType.SECTION_SEP, '---', start, this.position());
    }

    // Comments
    if (char === '/' && this.peekAhead(1) === '/') {
      return this.scanLineComment(start);
    }
    if (char === '/' && this.peekAhead(1) === '*') {
      return this.scanBlockComment(start);
    }

    // Reference {{...}}
    if (char === '{' && this.peekAhead(1) === '{') {
      return this.scanReference(start);
    }

    // Block reference #identifier
    if (char === '#') {
      return this.scanBlockRef(start);
    }

    // @ identifiers and keywords
    if (char === '@') {
      return this.scanAtIdentifier(start);
    }

    // Strings
    if (char === '"' || char === "'") {
      return this.scanString(start, char);
    }

    // Numbers
    if (this.isDigit(char) || (char === '-' && this.isDigit(this.peekAhead(1)))) {
      return this.scanNumber(start);
    }

    // Identifiers
    if (this.isAlpha(char) || char === '_') {
      return this.scanIdentifier(start);
    }

    // Multi-character operators
    if (char === '=' && this.peekAhead(1) === '>') {
      this.advance();
      this.advance();
      return createToken(TokenType.FAT_ARROW, '=>', start, this.position());
    }
    if (char === '=' && this.peekAhead(1) === '=' && this.peekAhead(2) === '=') {
      this.advance();
      this.advance();
      this.advance();
      return createToken(TokenType.STRICT_EQ, '===', start, this.position());
    }
    if (char === '=' && this.peekAhead(1) === '=') {
      this.advance();
      this.advance();
      return createToken(TokenType.EQ, '==', start, this.position());
    }
    if (char === '!' && this.peekAhead(1) === '=' && this.peekAhead(2) === '=') {
      this.advance();
      this.advance();
      this.advance();
      return createToken(TokenType.STRICT_NEQ, '!==', start, this.position());
    }
    if (char === '!' && this.peekAhead(1) === '=') {
      this.advance();
      this.advance();
      return createToken(TokenType.NEQ, '!=', start, this.position());
    }
    if (char === '-' && this.peekAhead(1) === '>') {
      this.advance();
      this.advance();
      return createToken(TokenType.ARROW, '->', start, this.position());
    }
    if (char === '<' && this.peekAhead(1) === '=') {
      this.advance();
      this.advance();
      return createToken(TokenType.LTE, '<=', start, this.position());
    }
    if (char === '>' && this.peekAhead(1) === '=') {
      this.advance();
      this.advance();
      return createToken(TokenType.GTE, '>=', start, this.position());
    }
    if (char === '&' && this.peekAhead(1) === '&') {
      this.advance();
      this.advance();
      return createToken(TokenType.AND, '&&', start, this.position());
    }
    if (char === '|' && this.peekAhead(1) === '|') {
      this.advance();
      this.advance();
      return createToken(TokenType.OR, '||', start, this.position());
    }

    // Single-character tokens
    this.advance();
    switch (char) {
      case '{':
        return createToken(TokenType.LBRACE, '{', start, this.position());
      case '}':
        return createToken(TokenType.RBRACE, '}', start, this.position());
      case '[':
        return createToken(TokenType.LBRACKET, '[', start, this.position());
      case ']':
        return createToken(TokenType.RBRACKET, ']', start, this.position());
      case '(':
        return createToken(TokenType.LPAREN, '(', start, this.position());
      case ')':
        return createToken(TokenType.RPAREN, ')', start, this.position());
      case ';':
        return createToken(TokenType.SEMICOLON, ';', start, this.position());
      case ':':
        return createToken(TokenType.COLON, ':', start, this.position());
      case ',':
        return createToken(TokenType.COMMA, ',', start, this.position());
      case '.':
        return createToken(TokenType.DOT, '.', start, this.position());
      case '/':
        return createToken(TokenType.SLASH, '/', start, this.position());
      case '=':
        return createToken(TokenType.EQUALS, '=', start, this.position());
      case '+':
        return createToken(TokenType.PLUS, '+', start, this.position());
      case '-':
        return createToken(TokenType.MINUS, '-', start, this.position());
      case '*':
        return createToken(TokenType.STAR, '*', start, this.position());
      case '%':
        return createToken(TokenType.PERCENT, '%', start, this.position());
      case '<':
        return createToken(TokenType.LT, '<', start, this.position());
      case '>':
        return createToken(TokenType.GT, '>', start, this.position());
      case '!':
        return createToken(TokenType.NOT, '!', start, this.position());
      case '\n':
        return createToken(TokenType.NEWLINE, '\n', start, this.position());
      default:
        return createToken(TokenType.ERROR, char, start, this.position());
    }
  }

  private scanLineComment(start: Position): Token {
    let value = '';
    // Skip //
    this.advance();
    this.advance();
    while (!this.isAtEnd() && this.peek() !== '\n') {
      value += this.advance();
    }
    return createToken(TokenType.COMMENT, value.trim(), start, this.position());
  }

  private scanBlockComment(start: Position): Token {
    let value = '';
    // Skip /*
    this.advance();
    this.advance();
    while (!this.isAtEnd()) {
      if (this.peek() === '*' && this.peekAhead(1) === '/') {
        this.advance();
        this.advance();
        break;
      }
      const char = this.advance();
      if (char === '\n') {
        this.line++;
        this.column = 1;
      }
      value += char;
    }
    return createToken(TokenType.COMMENT, value.trim(), start, this.position());
  }

  private scanReference(start: Position): Token {
    let value = '';
    // Skip {{
    this.advance();
    this.advance();
    while (!this.isAtEnd()) {
      if (this.peek() === '}' && this.peekAhead(1) === '}') {
        this.advance();
        this.advance();
        break;
      }
      value += this.advance();
    }
    return createToken(TokenType.REFERENCE, value, start, this.position());
  }

  private scanBlockRef(start: Position): Token {
    // Skip #
    this.advance();
    let value = '';
    while (!this.isAtEnd() && (this.isAlphaNumeric(this.peek()) || this.peek() === '_' || this.peek() === '-')) {
      value += this.advance();
    }
    return createToken(TokenType.BLOCK_REF, value, start, this.position());
  }

  private scanAtIdentifier(start: Position): Token {
    // Skip @
    this.advance();
    let value = '';
    while (!this.isAtEnd() && (this.isAlphaNumeric(this.peek()) || this.peek() === '_' || this.peek() === '-')) {
      value += this.advance();
    }
    return createToken(TokenType.AT_IDENTIFIER, value, start, this.position());
  }

  private scanString(start: Position, quote: string): Token {
    let value = '';
    // Skip opening quote
    this.advance();
    while (!this.isAtEnd() && this.peek() !== quote) {
      if (this.peek() === '\\') {
        this.advance();
        if (!this.isAtEnd()) {
          const escaped = this.advance();
          switch (escaped) {
            case 'n':
              value += '\n';
              break;
            case 't':
              value += '\t';
              break;
            case 'r':
              value += '\r';
              break;
            case '\\':
              value += '\\';
              break;
            case '"':
              value += '"';
              break;
            case "'":
              value += "'";
              break;
            case 'u':
              // Unicode escape \uXXXX
              let hex = '';
              for (let i = 0; i < 4 && !this.isAtEnd(); i++) {
                hex += this.advance();
              }
              value += String.fromCharCode(parseInt(hex, 16));
              break;
            default:
              value += escaped;
          }
        }
      } else {
        if (this.peek() === '\n') {
          this.line++;
          this.column = 1;
        }
        value += this.advance();
      }
    }
    // Skip closing quote
    if (!this.isAtEnd()) {
      this.advance();
    }
    return createToken(TokenType.STRING, value, start, this.position());
  }

  private scanNumber(start: Position): Token {
    let value = '';
    if (this.peek() === '-') {
      value += this.advance();
    }
    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      value += this.advance();
    }
    // Decimal part
    if (this.peek() === '.' && this.isDigit(this.peekAhead(1))) {
      value += this.advance();
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        value += this.advance();
      }
    }
    // Exponent part
    if (this.peek() === 'e' || this.peek() === 'E') {
      value += this.advance();
      if (this.peek() === '+' || this.peek() === '-') {
        value += this.advance();
      }
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        value += this.advance();
      }
    }
    return createToken(TokenType.NUMBER, value, start, this.position());
  }

  private scanIdentifier(start: Position): Token {
    let value = '';
    while (!this.isAtEnd()) {
      const char = this.peek();
      if (this.isAlphaNumeric(char) || char === '_') {
        value += this.advance();
      } else if (char === '-' && this.isAlpha(this.peekAhead(1))) {
        // Allow hyphens when followed by a letter (kebab-case identifiers)
        value += this.advance();
      } else {
        break;
      }
    }
    // Check for boolean/null literals
    if (value === 'true' || value === 'false') {
      return createToken(TokenType.BOOLEAN, value, start, this.position());
    }
    if (value === 'null') {
      return createToken(TokenType.NULL, value, start, this.position());
    }
    return createToken(TokenType.IDENTIFIER, value, start, this.position());
  }

  private skipWhitespace(): void {
    while (!this.isAtEnd()) {
      const char = this.peek();
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else if (char === '\n') {
        // Don't skip newlines - they may be significant
        break;
      } else {
        break;
      }
    }
  }

  private isAtEnd(): boolean {
    return this.pos >= this.source.length;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.pos];
  }

  private peekAhead(offset: number): string {
    if (this.pos + offset >= this.source.length) return '\0';
    return this.source[this.pos + offset];
  }

  private advance(): string {
    const char = this.source[this.pos];
    this.pos++;
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  private position(): Position {
    return {
      line: this.line,
      column: this.column,
      offset: this.pos,
    };
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}

export function tokenize(source: string): Token[] {
  const lexer = new Lexer(source);
  return lexer.tokenize();
}
