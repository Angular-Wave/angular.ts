import { assertArg, isString } from "./utils.js";
import { createElementFromHTML } from "./dom.js";

/**
 * A type-safe wrapper around a DOM Node, HTMLElement, HTML string, NodeList, or an array of Nodes.
 * Provides guarantees around presence and access.
 */
export class NodeRef {
  /**
   * @param {Node | Element | string | NodeList | Node[]} element - The DOM node(s) or HTML string to wrap.
   * @throws {Error} If the argument is invalid or cannot be wrapped properly.
   */
  constructor(element) {
    assertArg(element, "element");

    /** @private @type {Node | ChildNode | null} */
    this._node = null;

    /** @private @type {Element | undefined} */
    this._element = undefined;

    /** @private @type {NodeList} */
    this._nodes = undefined;

    /** @type {boolean} */
    this.linked = false;

    /** @type {boolean} */
    this.isList = false;

    // Handle HTML string
    if (isString(element)) {
      let res = createElementFromHTML(/** @type {string} */ (element));
      switch (true) {
        case res instanceof Element:
          this.element = res;
          break;
        case res instanceof Node:
          this.node = res;
          break;
      }
    }

    // Handle NodeList
    else if (element instanceof NodeList) {
      if (element.length == 1) {
        this.node = element[0];
      } else {
        this._nodes = element;
        this.isList = true;
      }
    } else if (element instanceof Element) {
      this._element = /** @type {Element} */ element;
    }

    // Handle single Node
    else if (element instanceof Node) {
      this._node = element;
    } else if (element instanceof Array) {
      // const fragment = document.createDocumentFragment();
      // element.forEach(el => {
      //   fragment.appendChild(el);
      // });
      // this._nodes = fragment.childNodes;
      // this.isList = true;
    } else {
      throw new Error("Invalid element passed to NodeRef");
    }
  }

  /** @returns {Element} */
  get element() {
    assertArg(this._element, "element");
    return this._element;
  }

  /** @param {Element} el */
  set element(el) {
    assertArg(el instanceof Element, "element");
    this._element = el;
    this._nodes = undefined;
    this.isList = false;
  }

  /** @returns {Node | ChildNode} */
  get node() {
    assertArg(this._node || this._element, "node");
    return this._node || this._element;
  }

  /** @param {Node | ChildNode} node */
  set node(node) {
    assertArg(node instanceof Node, "node");
    this._node = node;
    if (node.nodeType === Node.ELEMENT_NODE) {
      this._element = /** @type {Element} */ (node);
    }
  }

  /** @param {Node[]} nodes */
  set nodes(nodes) {
    assertArg(
      Array.isArray(nodes) && nodes.every((n) => n instanceof Node),
      "nodes",
    );
    this._nodes = nodes;
    this.isList = true;
  }

  /** @returns {NodeList} */
  get nodes() {
    assertArg(this._nodes, "nodes");
    return this._nodes;
  }

  /** @returns {Element | Node | ChildNode} */
  getAny() {
    if (this.isList) {
      return this._nodes[0];
    } else {
      return this._element || this._node;
    }
  }

  /** @returns {Element | NodeList | Node | ChildNode} */
  getAll() {
    if (this.isList) {
      return this._nodes;
    } else {
      return this._element || this._node;
    }
  }

  /**
   * @param {number} index
   * @returns {Element | Node | ChildNode}
   */
  getIndex(index) {
    if (this.isList) {
      return this._nodes[index];
    } else {
      return this.node;
    }
  }

  /**
   * @param {number} index
   * @param {Element | Node | ChildNode} node
   * @returns {void}
   */
  setIndex(index, node) {
    if (this.isList) {
      this._nodes[index] = node;
    } else {
      this.node = node;
    }
  }
}
