/**
 * A type-safe wrapper around a DOM Node, HTMLElement, HTML string, NodeList, or an array of Nodes.
 * Provides guarantees around presence and access.
 */
export class NodeRef {
    /**
     * @param {Node | HTMLElement | string | Node[] | NodeList} element - The DOM node(s) or HTML string to wrap.
     * @throws {Error} If the argument is invalid or cannot be wrapped properly.
     */
    constructor(element: Node | HTMLElement | string | Node[] | NodeList);
    /** @private @type {Node | ChildNode | null} */
    private _node;
    /** @private @type {Element | undefined} */
    private _element;
    /** @private @type {Node[]} */
    private _nodes;
    /** @type {boolean} */
    synthetic: boolean;
    /** @type {boolean} */
    linked: boolean;
    /** @type {boolean} */
    isList: boolean;
    /** @param {Element} el */
    set element(el: Element);
    /** @returns {Element} */
    get element(): Element;
    /** @param {Node | ChildNode} node */
    set node(node: Node | ChildNode);
    /** @returns {Node | ChildNode} */
    get node(): Node | ChildNode;
    /** @param {Node[]} nodes */
    set nodes(nodes: Node[]);
    /** @returns {Node[]} */
    get nodes(): Node[];
    /** @returns {Element | Node | ChildNode} */
    getAny(): Element | Node | ChildNode;
    /**
     * @param {number} index
     * @returns {Element | Node | ChildNode}
     */
    getIndex(index: number): Element | Node | ChildNode;
    /**
     * @param {number} index
     * @param {Element | Node | ChildNode} node
     * @returns {void}
     */
    setIndex(index: number, node: Element | Node | ChildNode): void;
}
