import { $parseMinErr } from "./parse";

import { isDefined } from "../../shared/utils";

const ESCAPE = {
  n: "\n",
  f: "\f",
  r: "\r",
  t: "\t",
  v: "\v",
  "'": "'",
  '"': '"',
};

const OPERATORS = new Set(
  "+ - * / % === !== == != < > <= >= && || ! = |".split(" "),
);

/**
 * @constructor
 */
export const Lexer = function Lexer(options) {
  this.options = options;
};

Lexer.prototype = {
  constructor: Lexer,

  lex(text) {
    this.text = text;
    this.index = 0;
    this.tokens = [];

    while (this.index < this.text.length) {
      const ch = this.text.charAt(this.index);
      if (ch === '"' || ch === "'") {
        this.readString(ch);
      } else if (
        this.isNumber(ch) ||
        (ch === "." && this.isNumber(this.peek()))
      ) {
        this.readNumber();
      } else if (this.isIdentifierStart(this.peekMultichar())) {
        this.readIdent();
      } else if (this.is(ch, "(){}[].,;:?")) {
        this.tokens.push({ index: this.index, text: ch });
        this.index++;
      } else if (this.isWhitespace(ch)) {
        this.index++;
      } else {
        const ch2 = ch + this.peek();
        const ch3 = ch2 + this.peek(2);
        const op1 = OPERATORS.has(ch);
        const op2 = OPERATORS.has(ch2);
        const op3 = OPERATORS.has(ch3);
        if (op1 || op2 || op3) {
          const token = op3 ? ch3 : op2 ? ch2 : ch;
          this.tokens.push({ index: this.index, text: token, operator: true });
          this.index += token.length;
        } else {
          this.throwError(
            "Unexpected next character ",
            this.index,
            this.index + 1,
          );
        }
      }
    }
    return this.tokens;
  },

  is(ch, chars) {
    return chars.indexOf(ch) !== -1;
  },

  peek(i) {
    const num = i || 1;
    return this.index + num < this.text.length
      ? this.text.charAt(this.index + num)
      : false;
  },

  isNumber(ch) {
    return ch >= "0" && ch <= "9" && typeof ch === "string";
  },

  isWhitespace(ch) {
    // IE treats non-breaking space as \u00A0
    return (
      ch === " " ||
      ch === "\r" ||
      ch === "\t" ||
      ch === "\n" ||
      ch === "\v" ||
      ch === "\u00A0"
    );
  },

  isIdentifierStart(ch) {
    return this.options.isIdentifierStart
      ? this.options.isIdentifierStart(ch, this.codePointAt(ch))
      : this.isValidIdentifierStart(ch);
  },

  isValidIdentifierStart(ch) {
    return (
      (ch >= "a" && ch <= "z") ||
      (ch >= "A" && ch <= "Z") ||
      ch === "_" ||
      ch === "$"
    );
  },

  isIdentifierContinue(ch) {
    return this.options.isIdentifierContinue
      ? this.options.isIdentifierContinue(ch, this.codePointAt(ch))
      : this.isValidIdentifierContinue(ch);
  },

  isValidIdentifierContinue(ch) {
    return this.isValidIdentifierStart(ch) || this.isNumber(ch);
  },

  codePointAt(ch) {
    if (ch.length === 1) return ch.charCodeAt(0);

    return (ch.charCodeAt(0) << 10) + ch.charCodeAt(1) - 0x35fdc00;
  },

  peekMultichar() {
    const ch = this.text.charAt(this.index);
    const peek = this.peek();
    if (!peek) {
      return ch;
    }
    const cp1 = ch.charCodeAt(0);
    const cp2 = peek.charCodeAt(0);
    if (cp1 >= 0xd800 && cp1 <= 0xdbff && cp2 >= 0xdc00 && cp2 <= 0xdfff) {
      return ch + peek;
    }
    return ch;
  },

  isExpOperator(ch) {
    return ch === "-" || ch === "+" || this.isNumber(ch);
  },

  throwError(error, start, end) {
    end = end || this.index;
    const colStr = isDefined(start)
      ? `s ${start}-${this.index} [${this.text.substring(start, end)}]`
      : ` ${end}`;
    throw $parseMinErr(
      "lexerr",
      "Lexer Error: {0} at column{1} in expression [{2}].",
      error,
      colStr,
      this.text,
    );
  },

  readNumber() {
    let number = "";
    const start = this.index;
    while (this.index < this.text.length) {
      const ch = this.text.charAt(this.index).toLowerCase();
      if (ch === "." || this.isNumber(ch)) {
        number += ch;
      } else {
        const peekCh = this.peek();
        if (ch === "e" && this.isExpOperator(peekCh)) {
          number += ch;
        } else if (
          this.isExpOperator(ch) &&
          peekCh &&
          this.isNumber(peekCh) &&
          number.charAt(number.length - 1) === "e"
        ) {
          number += ch;
        } else if (
          this.isExpOperator(ch) &&
          (!peekCh || !this.isNumber(peekCh)) &&
          number.charAt(number.length - 1) === "e"
        ) {
          this.throwError("Invalid exponent");
        } else {
          break;
        }
      }
      this.index++;
    }
    this.tokens.push({
      index: start,
      text: number,
      constant: true,
      value: Number(number),
    });
  },

  readIdent() {
    const start = this.index;
    this.index += this.peekMultichar().length;
    while (this.index < this.text.length) {
      const ch = this.peekMultichar();
      if (!this.isIdentifierContinue(ch)) {
        break;
      }
      this.index += ch.length;
    }
    this.tokens.push({
      index: start,
      text: this.text.slice(start, this.index),
      identifier: true,
    });
  },

  readString(quote) {
    const start = this.index;
    this.index++;
    let string = "";
    let rawString = quote;
    let escape = false;
    while (this.index < this.text.length) {
      const ch = this.text.charAt(this.index);
      rawString += ch;
      if (escape) {
        if (ch === "u") {
          const hex = this.text.substring(this.index + 1, this.index + 5);
          if (!hex.match(/[\da-f]{4}/i)) {
            this.throwError(`Invalid unicode escape [\\u${hex}]`);
          }
          this.index += 4;
          string += String.fromCharCode(parseInt(hex, 16));
        } else {
          const rep = ESCAPE[ch];
          string += rep || ch;
        }
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === quote) {
        this.index++;
        this.tokens.push({
          index: start,
          text: rawString,
          constant: true,
          value: string,
        });
        return;
      } else {
        string += ch;
      }
      this.index++;
    }
    this.throwError("Unterminated quote", start);
  },
};
