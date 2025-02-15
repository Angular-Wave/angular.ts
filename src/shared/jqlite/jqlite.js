import {
  minErr,
  concat,
  extend,
  isDefined,
  isFunction,
  isObject,
  isString,
  isUndefined,
  lowercase,
  getNodeName,
  shallowCopy,
} from "../utils.js";
import { CACHE, EXPANDO } from "../../core/cache/cache.js";

/** @type {number} */
let jqId = 1;

const DASH_LOWERCASE_REGEXP = /-([a-z])/g;
const UNDERSCORE_LOWERCASE_REGEXP = /_([a-z])/g;
const JQLiteMinErr = minErr("jqLite");

const SINGLE_TAG_REGEXP = /^<([\w-]+)\s*\/?>(?:<\/\1>|)$/;
const TAG_NAME_REGEXP = /<([\w:-]+)/;

// Table parts need to be wrapped with `<table>` or they're
// stripped to their contents when put in a div.
// XHTML parsers do not magically insert elements in the
// same way that tag soup parsers do, so we cannot shorten
// this by omitting <tbody> or other required elements.
const wrapMap = {
  thead: ["table"],
  col: ["colgroup", "table"],
  tr: ["tbody", "table"],
  td: ["tr", "tbody", "table"],
};

wrapMap.tbody =
  wrapMap.tfoot =
  wrapMap.colgroup =
  wrapMap.caption =
    wrapMap.thead;
wrapMap.th = wrapMap.td;

export const BOOLEAN_ATTR = {};
"multiple,selected,checked,disabled,readOnly,required,open"
  .split(",")
  .forEach((value) => {
    BOOLEAN_ATTR[lowercase(value)] = value;
  });
const BOOLEAN_ELEMENTS = {};
"input,select,option,textarea,button,form,details"
  .split(",")
  .forEach((value) => {
    BOOLEAN_ELEMENTS[value] = true;
  });

/**
 * JQLite is both a function and an array-like data structure for manipulation of DOM, linking elements to expando cache,
 * and execution of chains of functions.
 *
 * @param {string|Node|Node[]|NodeList|JQLite|ArrayLike<Element>|(() => void)|Window} element
 * @returns {JQLite}
 */
export function JQLite(element) {
  if (element instanceof JQLite) {
    return /** @type {JQLite} */ (element);
  }

  let argIsString = false;

  if (isString(element)) {
    element = /** @type {string} */ (element).trim();
    argIsString = true;
  }

  if (!(this instanceof JQLite)) {
    if (argIsString && /** @type {string} */ (element).charAt(0) !== "<") {
      throw JQLiteMinErr(
        "nosel",
        "Looking up elements via selectors is not supported by JQLite! See: http://docs.angularjs.org/api/angular.element",
      );
    }
    return new JQLite(element);
  }

  if (argIsString) {
    const parsed = parseHtml(/** @type {string} */ (element));
    addNodes(this, parsed);
  } else if (isFunction(element)) {
    onReady(/** @type {Function} */ (element));
  } else {
    addNodes(this, element);
  }
}

/// ///////////////////////////////////////
// Functions which are declared directly.
/// ///////////////////////////////////////
JQLite.prototype = {
  toString() {
    const value = [];
    for (var i = 0; i < this.length; i++) {
      value.push(`${this[i]}`);
    }
    return `[${value.join(", ")}]`;
  },

  eq(index) {
    return index >= 0 ? JQLite(this[index]) : JQLite(this[this.length + index]);
  },

  length: 0,
};

/**
 * @returns {Element[]}
 */
JQLite.prototype.elements = function () {
  /** @type {Element[]} */
  let elements = [];
  for (let index = 0; index < this.length; index++) {
    elements.push(this[index]);
  }
  return elements;
};

/**
 * Remove all child nodes of the set of matched elements from the DOM and clears CACHE data, associated with the node.
 * @returns {JQLite} The current instance of JQLite.
 */
JQLite.prototype.empty = function () {
  for (let i = 0; i < this.length; i++) {
    const element = this[i];
    dealoc(element, true);
    // we may run into situation where we empty a transcluded node
    if (
      [
        Node.ELEMENT_NODE,
        Node.DOCUMENT_NODE,
        Node.DOCUMENT_FRAGMENT_NODE,
      ].includes(element.nodeType)
    ) {
      element.replaceChildren();
    }
  }
  return this;
};

/**
 * Returns the `$scope` of the element.
 * @returns {import("../../core/scope/scope").Scope}
 */
JQLite.prototype.scope = function () {
  // Can't use JQLiteData here directly so we stay compatible with jQuery!
  return (
    getOrSetCacheData(this[0], "$scope") ||
    getInheritedData(this[0].parentNode || this[0], ["$isolateScope", "$scope"])
  );
};

/**
 * Returns the isolate `$scope` of the element.
 * @returns {import("../../core/scope/scope").Scope}
 */
JQLite.prototype.isolateScope = function () {
  return (
    getOrSetCacheData(this[0], "$isolateScope") ||
    getOrSetCacheData(this[0], "$isolateScopeNoTemplate")
  );
};

/**
 * Return instance of controller attached to element
 * @param {string} [name] - Controller name
 * @returns {any}
 */
JQLite.prototype.controller = function (name) {
  return getController(this[0], name);
};

/**
 * Return instance of injector attached to element
 * @returns {import('../../core/di/internal-injector').InjectorService}
 */
JQLite.prototype.injector = function () {
  return getInheritedData(this[0], "$injector");
};

/**
 * Remove data  by name from cache associated with each element in JQLite collection.
 * @param {string} name - The key of the data associated with element
 * @returns {JQLite}
 */
JQLite.prototype.removeData = function (name) {
  for (let i = 0; i < this.length; i++) {
    const element = this[i];
    removeElementData(element, name);
  }
  return this;
};

/**
 * Gets or sets data on a parent element
 * @param {string} name
 * @param {any} [value]
 * @returns {JQLite|any}
 */
JQLite.prototype.inheritedData = function (name, value) {
  for (let i = 0; i < this.length; i++) {
    const element = this[0];
    let res = getInheritedData(element, name, value);
    if (value) {
      return this;
    } else {
      return res;
    }
  }
};

/**
 * Gets or sets innerHTML on the first element in JQLite collection
 * @param {string} [value]
 * @returns {JQLite|any|undefined}
 */
JQLite.prototype.html = function (value) {
  const element = this[0];
  if (!element) return undefined;
  if (isUndefined(value)) {
    return element.innerHTML;
  }
  dealoc(element, true);
  element.innerHTML = value;
  return this;
};

/**
 * @param {string|Object} name
 * @param {any} value
 * @returns
 */
JQLite.prototype.attr = function (name, value) {
  for (let i = 0; i < this.length; i++) {
    const element = this[i];
    let ret;
    const { nodeType } = element;
    if (
      nodeType === Node.TEXT_NODE ||
      nodeType === Node.ATTRIBUTE_NODE ||
      nodeType === Node.COMMENT_NODE ||
      !element.getAttribute
    ) {
      continue;
    }

    const lowercasedName = lowercase(name);
    const isBooleanAttr = BOOLEAN_ATTR[lowercasedName];

    if (isObject(name)) {
      for (let key in name) {
        element.setAttribute(key, isBooleanAttr ? lowercasedName : name[key]);
      }
    } else if (isDefined(value)) {
      // setter

      if (value === null || (value === false && isBooleanAttr)) {
        element.removeAttribute(name);
      } else {
        element.setAttribute(name, isBooleanAttr ? lowercasedName : value);
      }
    } else {
      // getter
      ret = element.getAttribute(name);
      if (isBooleanAttr && ret !== null) {
        ret = lowercasedName;
      }
      // Normalize non-existing attributes to undefined (as jQuery).
      return ret === null ? undefined : ret;
    }
  }

  if (isDefined(value) || isObject(name)) {
    return this;
  }
};

/**
 * @param {string|any} key - The key (as a string) to get/set or an object for mass-setting.
 * @param {any} [value] - The value to set. If not provided, the function acts as a getter.
 * @returns {JQLite|any} - The retrieved data if acting as a getter. Otherwise, returns undefined.
 */
JQLite.prototype.data = function (key, value) {
  let i;
  const nodeCount = this.length;
  if (isUndefined(value)) {
    if (isObject(key)) {
      // we are a write, but the object properties are the key/values
      for (i = 0; i < nodeCount; i++) {
        getOrSetCacheData(this[i], key);
      }
      return this;
    }
    // we are a read, so read the first child.
    const jj = isUndefined(value) ? Math.min(nodeCount, 1) : nodeCount;
    for (let j = 0; j < jj; j++) {
      const nodeValue = getOrSetCacheData(this[j], key, value);
      value = value ? value + nodeValue : nodeValue;
    }
    return value;
  }
  // we are a write, so apply to all children
  for (i = 0; i < nodeCount; i++) {
    getOrSetCacheData(this[i], key, value);
  }
  return this;
};

JQLite.prototype.replaceWith = function (arg1) {
  let value;
  let fn = function (element, replaceNode) {
    let index;
    const parent = element.parentNode;
    dealoc(element);
    const nodes = new JQLite(replaceNode);
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (index) {
        parent.insertBefore(node, index.nextSibling);
      } else {
        parent.replaceChild(node, element);
      }
      index = node;
    }
  };
  for (let i = 0; i < this.length; i++) {
    addNodes(value, fn(this[i], arg1));
  }
  return isDefined(value) ? value : this;
};

JQLite.prototype.children = function () {
  let value;
  let fn = (element) =>
    Array.from(element.childNodes).filter(
      (child) => child.nodeType === Node.ELEMENT_NODE,
    );
  for (let i = 0; i < this.length; i++) {
    value = JQLite(fn(this[i]));
  }
  return isDefined(value) ? value : this;
};

/**
 * @param {string|JQLite} node
 * @returns {JQLite}
 */
JQLite.prototype.append = function (node) {
  for (let i = 0; i < this.length; i++) {
    const element = this[i];
    const { nodeType } = element;
    if (
      nodeType !== Node.ELEMENT_NODE &&
      nodeType !== Node.DOCUMENT_FRAGMENT_NODE
    )
      return this;

    let newNode = new JQLite(node);

    for (let i = 0; i < newNode.length; i++) {
      const child = newNode[i];
      element.appendChild(child);
    }
  }
  return this;
};

/**
 * @param {string|JQLite} node
 * @returns {JQLite}
 */
JQLite.prototype.prepend = function (node) {
  for (let i = 0; i < this.length; i++) {
    const element = this[i];
    if (element.nodeType === Node.ELEMENT_NODE) {
      const index = element.firstChild;
      const el = new JQLite(node);
      for (let i = 0; i < el.length; i++) {
        element.insertBefore(el[i], index);
      }
    }
  }
  return this;
};

/**
 * @param {string} newElement
 * @returns {JQLite}
 */
JQLite.prototype.after = function (newElement) {
  for (let i = 0; i < this.length; i++) {
    const element = this[i];
    let index = element;
    const parent = element.parentNode;

    if (parent) {
      let el = new JQLite(newElement);

      for (let i = 0, ii = el.length; i < ii; i++) {
        const node = el[i];
        parent.insertBefore(node, index.nextSibling);
        index = node;
      }
    }
  }
  return this;
};

/**
 * @param {boolean} [keepData]
 * @returns
 */
JQLite.prototype.remove = function (keepData = false) {
  for (let i = 0; i < this.length; i++) {
    const element = this[i];
    removeElement(element, keepData);
  }
  return this;
};

JQLite.prototype.detach = function () {
  for (let i = 0; i < this.length; i++) {
    const element = this[i];
    removeElement(element, true);
  }
  return this;
};

JQLite.prototype.parent = function () {
  let value;
  let fn = (element) => {
    const parent = element.parentNode;
    return parent && parent.nodeType !== Node.DOCUMENT_FRAGMENT_NODE
      ? parent
      : null;
  };
  for (let i = 0, ii = this.length; i < ii; i++) {
    if (isUndefined(value)) {
      value = fn(this[i]);
      if (isDefined(value)) {
        value = JQLite(value);
      }
    } else {
      addNodes(value, fn(this[i]));
    }
  }
  return isDefined(value) ? value : this;
};

JQLite.prototype.find = function (selector) {
  let value;
  for (let i = 0, ii = this.length; i < ii; i++) {
    const element = this[i];

    if (isUndefined(value)) {
      if (element.getElementsByTagName) {
        value = element.getElementsByTagName(selector);
      } else {
        value = [];
      }
      if (isDefined(value)) {
        // any function which returns a value needs to be wrapped
        value = JQLite(value);
      }
    } else {
      if (element.getElementsByTagName) {
        addNodes(value, element.getElementsByTagName(selector));
      }
    }
  }
  return isDefined(value) ? value : this;
};

/**
 * TODO: REMOVE! This function being used ONLY in tests!
 */
JQLite.prototype.triggerHandler = function (event, extraParameters) {
  let value;
  let fn = function (element, event, extraParameters) {
    let dummyEvent;
    let eventFnsCopy;
    let handlerArgs;
    const eventName = event.type || event;
    const expandoStore = getExpando(element);
    const events = expandoStore && expandoStore.events;
    const eventFns = events && events[eventName];

    if (eventFns) {
      // Create a dummy event to pass to the handlers
      dummyEvent = {
        preventDefault() {
          this.defaultPrevented = true;
        },
        isDefaultPrevented() {
          return this.defaultPrevented === true;
        },
        stopImmediatePropagation() {
          this.immediatePropagationStopped = true;
        },
        isImmediatePropagationStopped() {
          return this.immediatePropagationStopped === true;
        },
        stopPropagation: () => {},
        type: eventName,
        target: element,
      };

      // If a custom event was provided then extend our dummy event with it
      if (event.type) {
        dummyEvent = extend(dummyEvent, event);
      }

      // Copy event handlers in case event handlers array is modified during execution.
      eventFnsCopy = shallowCopy(eventFns);
      handlerArgs = extraParameters
        ? [dummyEvent].concat(extraParameters)
        : [dummyEvent];

      eventFnsCopy.forEach((fn) => {
        if (!dummyEvent.isImmediatePropagationStopped()) {
          fn.apply(element, handlerArgs);
        }
      });
    }
  };
  for (let i = 0, ii = this.length; i < ii; i++) {
    if (isUndefined(value)) {
      fn(this[i], event, extraParameters);
    } else {
      addNodes(value, fn(this[i], event, extraParameters));
    }
  }
  return isDefined(value) ? value : this;
};

///////////////////////////////////////////////////////////////////
////////////        HELPER FUNCTIONS      /////////////////////////
///////////////////////////////////////////////////////////////////

/**
 *
 * @returns {number} Next unique JQInstance id
 */
function jqNextId() {
  return ++jqId;
}

/**
 * @param {string} _all
 * @param {string} letter
 * @returns {string}
 */
function fnCamelCaseReplace(_all, letter) {
  return letter.toUpperCase();
}

/**
 * Converts kebab-case to camelCase.
 * @param {string} name Name to normalize
 * @returns {string}
 */
export function kebabToCamel(name) {
  return name.replace(DASH_LOWERCASE_REGEXP, fnCamelCaseReplace);
}

/**
 * Converts sname to camelCase.
 * @param {string} name
 * @returns {string}
 */
export function snakeToCamel(name) {
  return name.replace(UNDERSCORE_LOWERCASE_REGEXP, fnCamelCaseReplace);
}

/**
 * Removes expando data from this element. If key is provided, only
 * its field is removed. If data is empty, also removes `ExpandoStore`
 * from cache.
 * @param {Element} element
 * @param {string} [name] - key of field to remove
 */
export function removeElementData(element, name) {
  const expandoId = element[EXPANDO];
  const expandoStore = expandoId && CACHE.get(expandoId);

  if (expandoStore) {
    if (name) {
      delete expandoStore.data[name];
    } else {
      expandoStore.data = {};
    }

    removeIfEmptyData(element);
  }
}

/**
 * Stores data associated with an element inside the expando property of the DOM element.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Glossary/Expando MDN Glossary: Expando}
 *
 * @param {Element} element
 * @param {boolean} [createIfNecessary=false]
 * @returns {import("../../core/cache/cache.js").ExpandoStore}
 */
export function getExpando(element, createIfNecessary = false) {
  let expandoId = element[EXPANDO];
  let expandoStore = expandoId && CACHE.get(expandoId);

  if (createIfNecessary && !expandoStore) {
    element[EXPANDO] = expandoId = jqNextId();
    expandoStore = {
      events: {},
      data: {},
      handle: null,
    };
    CACHE.set(expandoId, expandoStore);
  }

  return expandoStore;
}

/**
 * Checks if the string contains HTML tags or entities.
 * @param {string} html
 * @returns {boolean} True if the string is plain text, false if it contains HTML tags or entities.
 */
export function isTextNode(html) {
  return !/<|&#?\w+;/.test(html);
}

/**
 * Check if element can accept expando data
 * @param {Element} node
 * @returns {boolean}
 */
function elementAcceptsData(node) {
  // The window object can accept data but has no nodeType
  // Otherwise we are only interested in elements (1) and documents (9)
  switch (node.nodeType) {
    case Node.ELEMENT_NODE:
    case Node.DOCUMENT_NODE:
    case Node.COMMENT_NODE:
    case undefined: // window.object
      return true;
    default:
      return false;
  }
}

/**
 * @param {string} html
 * @returns {DocumentFragment}
 */
export function buildFragment(html) {
  /** @type {HTMLDivElement} */
  let tmp;
  let tag;
  let wrap;
  let tempFragment = document.createDocumentFragment();
  let nodes = [];
  let i;

  if (isTextNode(html)) {
    // Convert non-html into a text node
    nodes.push(document.createTextNode(html));
  } else {
    // Convert html into DOM nodes

    tmp = tempFragment.appendChild(document.createElement("div"));
    tag = (TAG_NAME_REGEXP.exec(html) || ["", ""])[1].toLowerCase();

    wrap = wrapMap[tag] || [];

    // Create wrappers & descend into them
    i = wrap.length;
    while (--i > -1) {
      tmp.appendChild(document.createElement(wrap[i]));
      tmp = /** @type {HTMLDivElement} */ (tmp.firstChild);
    }
    tmp.innerHTML = html;

    nodes = concat(nodes, tmp.childNodes);

    tmp = /** @type {HTMLDivElement} */ (tempFragment.firstChild);
    tmp.textContent = "";
  }

  let fragment = document.createDocumentFragment();
  fragment.append(...nodes);
  return fragment;
}

/**
 * @param {string} html
 * @returns {NodeListOf<ChildNode> | HTMLElement[]}
 */
function parseHtml(html) {
  let regEx = SINGLE_TAG_REGEXP.exec(html);
  if (regEx) {
    return [document.createElement(regEx[1])];
  }
  let fragment = buildFragment(html);
  if (fragment) {
    return fragment.childNodes;
  }

  return [];
}

/**
 * @param {Element} element
 * @param {boolean} [onlyDescendants]
 * @returns {void}
 */
export function dealoc(element, onlyDescendants) {
  if (!element) return;
  if (Array.isArray(element)) {
    element.forEach((x) => dealoc(x, onlyDescendants));
  } else {
    if (!onlyDescendants && elementAcceptsData(element)) {
      cleanElementData([element]);
    }

    if (elementAcceptsData(element)) {
      cleanElementData(element.querySelectorAll("*"));
    }
  }
}

/**
 * If `ExpandoStore.data` and `ExpandoStore.events` are empty,
 * then delete element's `ExpandoStore` and set its `ExpandoId`
 * to undefined.
 * @param {Element} element
 */
function removeIfEmptyData(element) {
  const expandoId = element[EXPANDO];
  const { events, data } = CACHE.get(expandoId);

  if (
    (!data || !Object.keys(data).length) &&
    (!events || !Object.keys(events).length)
  ) {
    CACHE.delete(expandoId);
    element[EXPANDO] = undefined; // don't delete DOM expandos. Chrome don't like it
  }
}

/**
 * Gets or sets cache data for a given element.
 *
 * @param {Element} element - The DOM element to get or set data on.
 * @param {string|Object} key - The key (as a string) to get/set or an object for mass-setting.
 * @param {*} [value] - The value to set. If not provided, the function acts as a getter.
 * @returns {*} - The retrieved data if acting as a getter. Otherwise, returns undefined.
 */
export function getOrSetCacheData(element, key, value) {
  if (elementAcceptsData(element)) {
    let prop;

    const isSimpleSetter = isDefined(value);
    const isSimpleGetter = !isSimpleSetter && key && !isObject(key);
    const massGetter = !key;
    const expandoStore = getExpando(element, !isSimpleGetter);
    const data = expandoStore && expandoStore.data;

    if (isSimpleSetter) {
      data[kebabToCamel(key)] = value;
    } else {
      if (massGetter) {
        return data;
      }
      if (isSimpleGetter) {
        // don't force creation of expandoStore if it doesn't exist yet
        return data && data[kebabToCamel(key)];
      }
      // mass-setter: data({key1: val1, key2: val2})
      for (prop in key) {
        data[kebabToCamel(prop)] = key[prop];
      }
    }
  } else {
    // TODO: check should occur perhaps prior at compilation level that this is a valid element
  }
}

/**
 * Sets cache data for a given element.
 *
 * @param {Element} element - The DOM element to get or set data on.
 * @param {string} key - The key (as a string) to get/set or an object for mass-setting.
 * @param {*} [value] - The value to set. If not provided, the function acts as a getter.
 * @returns
 */
export function setCacheData(element, key, value) {
  if (elementAcceptsData(element)) {
    const expandoStore = getExpando(element, true);
    const data = expandoStore && expandoStore.data;
    data[kebabToCamel(key)] = value;
  } else {
    // TODO: check should occur perhaps prior at compilation level that this is a valid element
    setCacheData(element.parentElement, key, value);
  }
}

/**
 * Gets cache data for a given element.
 *
 * @param {Element} element - The DOM element to get data from.
 * @param {string} [key] - The key (as a string) to retrieve. If not provided, returns all data.
 * @returns {*} - The retrieved data for the given key or all data if no key is provided.
 */
export function getCacheData(element, key) {
  if (elementAcceptsData(element)) {
    const expandoStore = getExpando(element, false); // Don't create if it doesn't exist
    const data = expandoStore && expandoStore.data;
    if (!key) {
      return undefined;
    }
    return data && data[kebabToCamel(key)];
  }
  return undefined;
}

/**
 * Adds nodes or elements to the root array-like object.
 *
 * @param {JQLite} root - The array-like object to which elements will be added.
 * @param {(Node|Array|NodeList|Object)} elements - The elements to add to the root. This can be a single DOM node, an array-like object (such as an Array or NodeList), or any other object.
 */
function addNodes(root, elements) {
  if (!elements) return;
  // If a Node (the most common case)
  if (elements.nodeType) {
    root[root.length++] = elements;
    return;
  }
  const length = elements.length;
  // If elements is an Array or NodeList, but not a Window object
  if (typeof length === "number" && elements.window !== elements) {
    for (let i = 0; i < length; i++) {
      root[root.length++] = elements[i];
    }
  } else {
    root[root.length++] = elements;
  }
}

/**
 * @param {Node} element
 * @param {string} [name]
 * @returns
 */
export function getController(element, name) {
  return getInheritedData(element, `$${name || "ngController"}Controller`);
}

/**
 *
 * @param {Node} element
 * @param {string} name
 * @returns
 */
export function getInheritedData(element, name) {
  // if element is the document object work with the html element instead
  // this makes $(document).scope() possible
  if (element.nodeType === Node.DOCUMENT_NODE) {
    element = /** @type {Document} */ (element).documentElement;
  }

  let value;
  while (element) {
    if (
      isDefined((value = getCacheData(/** @type {Element} */ (element), name)))
    )
      return value;

    // If dealing with a document fragment node with a host element, and no parent, use the host
    // element as the parent. This enables directives within a Shadow DOM or polyfilled Shadow DOM
    // to lookup parent controllers.
    element =
      element.parentNode ||
      (element.nodeType === Node.DOCUMENT_FRAGMENT_NODE &&
        /** @type {ShadowRoot} */ (element).host);
  }
}

/**
 *
 * @param {Node} element
 * @param {string|string[]} name
 * @param {any} [value]
 * @returns
 */
export function setInheritedData(element, name, value) {
  // if element is the document object work with the html element instead
  // this makes $(document).scope() possible
  if (element.nodeType === Node.DOCUMENT_NODE) {
    element = /** @type {Document} */ (element).documentElement;
  }
  const names = Array.isArray(name) ? name : [name];

  while (element) {
    for (let i = 0, ii = names.length; i < ii; i++) {
      if (
        isDefined(
          (value = getOrSetCacheData(
            /** @type {Element} */ (element),
            names[i],
          )),
        )
      )
        return value;
    }

    // If dealing with a document fragment node with a host element, and no parent, use the host
    // element as the parent. This enables directives within a Shadow DOM or polyfilled Shadow DOM
    // to lookup parent controllers.
    element =
      element.parentNode ||
      (element.nodeType === Node.DOCUMENT_FRAGMENT_NODE &&
        /** @type {ShadowRoot} */ (element).host);
  }
}

/**
 *
 * @param {Element} element
 * @param {boolean} keepData
 */
export function removeElement(element, keepData = false) {
  if (!keepData) {
    dealoc(element);
  }
  const parent = element.parentNode;
  if (parent) parent.removeChild(element);
}

/**
 * Execute a function on `DOMContentLoaded`
 * @param {Function} fn
 */
function onReady(fn) {
  function trigger() {
    document.removeEventListener("DOMContentLoaded", trigger);
    fn();
  }
  // check if document is already loaded
  if (document.readyState === "complete") {
    setTimeout(fn);
  } else {
    // We can not use JQLite since we are not done loading.
    document.addEventListener("DOMContentLoaded", trigger);
  }
}

/**
 * Extracts the starting tag from an HTML string or DOM element.
 *
 * @param {string|Element} elementOrStr - The HTML string or DOM element to process.
 * @returns {string} The starting tag or processed result.
 */
export function startingTag(elementOrStr) {
  let clone;

  if (typeof elementOrStr === "string") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(elementOrStr, "text/html");
    clone = doc.body.firstChild.cloneNode(true);
  } else if (elementOrStr instanceof Element) {
    clone = elementOrStr.cloneNode(true);
  } else {
    throw new Error("Input must be an HTML string or a DOM element.");
  }

  while (clone.firstChild) {
    clone.removeChild(clone.firstChild);
  }

  const divWrapper = document.createElement("div");
  divWrapper.appendChild(clone);
  const elemHtml = divWrapper.innerHTML;

  try {
    if (clone.nodeType === Node.TEXT_NODE) {
      return elemHtml.toLowerCase();
    } else if (clone.nodeType === Node.COMMENT_NODE) {
      return `<!--${/** @type {Comment} **/ (clone).data.trim()}-->`;
    } else {
      const match = elemHtml.match(/^(<[^>]+>)/);
      if (match) {
        return match[1].replace(/^<([\w-]+)/, (_match, nodeName) => {
          return "<" + nodeName.toLowerCase();
        });
      }
    }
  } catch (e) {
    return elemHtml.toLowerCase();
  }

  return elemHtml.toLowerCase();
}

/**
 * Return the DOM siblings between the first and last node in the given array.
 * @param {JQLite|Array} nodes An array-like object
 * @returns {JQLite} the inputted object or a JQLite collection containing the nodes
 */
export function getBlockNodes(nodes) {
  // TODO(perf): update `nodes` instead of creating a new object?
  let node = nodes[0];
  const endNode = nodes[nodes.length - 1];
  let blockNodes;

  for (let i = 1; node !== endNode && (node = node.nextSibling); i++) {
    if (blockNodes || nodes[i] !== node) {
      if (!blockNodes) {
        // use element to avoid circular dependency
        blockNodes = Array.prototype.slice.call(nodes, 0, i);
      }
      blockNodes.push(node);
    }
  }

  return JQLite(blockNodes || nodes);
}

export function getBooleanAttrName(element, name) {
  const booleanAttr = BOOLEAN_ATTR[name.toLowerCase()];
  return booleanAttr && BOOLEAN_ELEMENTS[getNodeName(element)] && booleanAttr;
}

/**
 * Takes an array of elements, calls any `$destroy` event handlers, removes any data in cache, and finally removes any
 * listeners.
 * @param {NodeListOf<Element>|Element[]} nodes
 */
export function cleanElementData(nodes) {
  for (let i = 0, ii = nodes.length; i < ii; i++) {
    const events = (CACHE.get(nodes[i][EXPANDO]) || {}).events;
    if (events && events.$destroy) {
      JQLite(nodes[i]).triggerHandler("$destroy");
    }
    removeElementData(nodes[i]);
  }
}

/**
 * Return instance of injector attached to element
 * @returns {import('../../core/di/internal-injector.js').InjectorService}
 */
export function getInjector(element) {
  return getInheritedData(element, "$injector");
}

export function setData(element, key, value) {
  getOrSetCacheData(element, key, value);
}

/**
 * Creates a DOM element from an HTML string.
 * @param {string} htmlString - A string representing the HTML to parse.
 * @returns {Element} - The parsed DOM element.
 */
export function createElementFromHTML(htmlString) {
  const template = document.createElement("template");
  template.innerHTML = htmlString.trim();
  return /** @type {Element} */ (template.content.firstChild);
}

/**
 * Creates a DOM element from an HTML string.
 * @param {string} htmlString - A string representing the HTML to parse.
 * @returns {NodeList} - The parsed DOM element.
 */
export function createNodelistFromHTML(htmlString) {
  const template = document.createElement("template");
  template.innerHTML = htmlString.trim();
  return template.content.childNodes;
}

/**
 * Appends nodes or an HTML string to a given DOM element.
 * @param {Element} element - The element to append nodes to.
 * @param {Node | Node[] | string} nodes - Nodes or HTML string to append.
 */
export function appendNodesToElement(element, nodes) {
  if (typeof nodes === "string") {
    const template = document.createElement("template");
    template.innerHTML = nodes.trim();
    nodes = Array.from(template.content.childNodes);
  } else if (nodes instanceof Node) {
    nodes = [nodes];
  } else if (!Array.isArray(nodes)) {
    throw new TypeError("Expected a Node, Node[], or HTML string");
  }

  nodes.forEach((node) => element.appendChild(node));
}

/**
 * Remove element from the DOM and clear CACHE data, associated with the node.
 * @param {Element} element
 */
export function emptyElement(element) {
  dealoc(element, true);
  switch (element.nodeType) {
    case Node.ELEMENT_NODE:
    case Node.DOCUMENT_NODE:
    case Node.DOCUMENT_FRAGMENT_NODE:
      element.replaceChildren();
      break;
  }
}

export function domInsert(element, parentElement, afterElement) {
  // if for some reason the previous element was removed
  // from the dom sometime before this code runs then let's
  // just stick to using the parent element as the anchor
  if (afterElement) {
    const afterNode = extractElementNode(afterElement);
    if (
      afterNode &&
      !afterNode.parentNode &&
      !afterNode.previousElementSibling
    ) {
      afterElement = null;
    }
  }
  if (afterElement) {
    afterElement.after(element);
  } else {
    parentElement.prepend(element);
  }
}

function extractElementNode(element) {
  const { length } = element;
  for (let i = 0; i < length; i++) {
    const elm = element[i];
    if (elm.nodeType === Node.ELEMENT_NODE) {
      return elm;
    }
  }
}
