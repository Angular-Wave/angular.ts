import { assertArg, isString } from "./utils.js";
import { createElementFromHTML } from "./dom.js";

/**
 * A type-safe wrapper around a DOM Node, HTMLElement, HTML string, NodeList, or an array of Nodes.
 * Provides guarantees around presence and access.
 */
export class NodeRef {
  /**
   * @param {Node | HTMLElement | string | Node[] | NodeList} element - The DOM node(s) or HTML string to wrap.
   * @throws {Error} If the argument is invalid or cannot be wrapped properly.
   */
  constructor(element) {
    assertArg(element, "element");

    /** @private @type {Node | ChildNode | null} */
    this._node = null;

    /** @private @type {Element | undefined} */
    this._element = undefined;

    /** @private @type {Node[]} */
    this._nodes = [];

    /** @type {boolean} */
    this.synthetic = false;

    /** @type {boolean} */
    this.linked = false;

    /** @type {boolean} */
    this.isList = false;

    // Handle NodeList
    if (element instanceof NodeList) {
      this._nodes = Array.from(element);
      this.isList = true;
    }

    // Handle array of Nodes
    else if (
      Array.isArray(element) &&
      element.every((e) => e instanceof Node)
    ) {
      this._nodes = element;
      this.isList = true;
    }

    // Handle HTML string
    else if (isString(element)) {
      this._node = createElementFromHTML(/** @type {string} */ (element));
      this.synthetic = true;
    }

    // Handle single Node
    else if (element instanceof Node) {
      this._node = element;
    } else {
      throw new Error("Invalid element passed to NodeRef");
    }

    // If it's not a list, extract element if applicable
    if (!this.isList && this._node?.nodeType === Node.ELEMENT_NODE) {
      this._element = /** @type {Element} */ (this._node);
    }
  }

  /** @returns {Element} */
  get element() {
    assertArg(this._element, "element");
    return this._element;
  }

  /** @returns {Node | ChildNode} */
  get node() {
    assertArg(this._node, "node");
    return this._node;
  }

  /** @returns {Node[]} */
  get nodes() {
    assertArg(this._nodes.length, "nodes");
    return this._nodes;
  }

  /** @returns {Element | Node | ChildNode} */
  getAny() {
    return this._element || this._node;
  }
}
