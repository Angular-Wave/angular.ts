import {
  minErr,
  extend,
  lowercase,
  isDefined,
  forEach,
  isArray,
  bind,
} from "../ng/utils";

const $sanitizeMinErr = minErr("$sanitize");
let htmlParser;
let htmlSanitizeWriter;
let nodeContains;

/**
 * @ngdoc module
 * @name ngSanitize
 * @description
 *
 * The `ngSanitize` module provides functionality to sanitize HTML.
 *
 * See {@link ngSanitize.$sanitize `$sanitize`} for usage.
 */

/**
 * @ngdoc service
 * @name $sanitize
 * @kind function
 *
 * @description
 *   Sanitizes an html string by stripping all potentially dangerous tokens.
 *
 *   The input is sanitized by parsing the HTML into tokens. All safe tokens (from a trusted URI list) are
 *   then serialized back to a properly escaped HTML string. This means that no unsafe input can make
 *   it into the returned string.
 *
 *   The trusted URIs for URL sanitization of attribute values is configured using the functions
 *   `aHrefSanitizationTrustedUrlList` and `imgSrcSanitizationTrustedUrlList` of {@link $compileProvider}.
 *
 *   The input may also contain SVG markup if this is enabled via {@link $sanitizeProvider}.
 *
 * @param {string} html HTML input.
 * @returns {string} Sanitized HTML.
 *
 */

/**
 * @ngdoc provider
 * @name $sanitizeProvider
 *
 *
 * @description
 * Creates and configures {@link $sanitize} instance.
 */
export function $SanitizeProvider() {
  let hasBeenInstantiated = false;
  let svgEnabled = false;

  this.$get = [
    "$$sanitizeUri",
    function ($$sanitizeUri) {
      hasBeenInstantiated = true;
      if (svgEnabled) {
        extend(validElements, svgElements);
      }
      return function (html) {
        const buf = [];
        htmlParser(
          html,
          htmlSanitizeWriter(
            buf,
            (uri, isImage) => !/^unsafe:/.test($$sanitizeUri(uri, isImage)),
          ),
        );
        return buf.join("");
      };
    },
  ];

  /**
   * @ngdoc method
   * @name $sanitizeProvider#enableSvg
   * @kind function
   *
   * @description
   * Enables a subset of svg to be supported by the sanitizer.
   *
   * <div class="alert alert-warning">
   *   <p>By enabling this setting without taking other precautions, you might expose your
   *   application to click-hijacking attacks. In these attacks, sanitized svg elements could be positioned
   *   outside of the containing element and be rendered over other elements on the page (e.g. a login
   *   link). Such behavior can then result in phishing incidents.</p>
   *
   *   <p>To protect against these, explicitly setup `overflow: hidden` css rule for all potential svg
   *   tags within the sanitized content:</p>
   *
   *   <br>
   *
   *   <pre><code>
   *   .rootOfTheIncludedContent svg {
   *     overflow: hidden !important;
   *   }
   *   </code></pre>
   * </div>
   *
   * @param {boolean=} flag Enable or disable SVG support in the sanitizer.
   * @returns {boolean|$sanitizeProvider} Returns the currently configured value if called
   *    without an argument or self for chaining otherwise.
   */
  this.enableSvg = function (enableSvg) {
    if (isDefined(enableSvg)) {
      svgEnabled = enableSvg;
      return this;
    }
    return svgEnabled;
  };

  /**
   * @ngdoc method
   * @name $sanitizeProvider#addValidElements
   * @kind function
   *
   * @description
   * Extends the built-in lists of valid HTML/SVG elements, i.e. elements that are considered safe
   * and are not stripped off during sanitization. You can extend the following lists of elements:
   *
   * - `htmlElements`: A list of elements (tag names) to extend the current list of safe HTML
   *   elements. HTML elements considered safe will not be removed during sanitization. All other
   *   elements will be stripped off.
   *
   * - `htmlVoidElements`: This is similar to `htmlElements`, but marks the elements as
   *   "void elements" (similar to HTML
   *   [void elements](https://rawgit.com/w3c/html/html5.1-2/single-page.html#void-elements)). These
   *   elements have no end tag and cannot have content.
   *
   * - `svgElements`: This is similar to `htmlElements`, but for SVG elements. This list is only
   *   taken into account if SVG is {@link ngSanitize.$sanitizeProvider#enableSvg enabled} for
   *   `$sanitize`.
   *
   * <div class="alert alert-info">
   *   This method must be called during the {@link angular.IModule#config config} phase. Once the
   *   `$sanitize` service has been instantiated, this method has no effect.
   * </div>
   *
   * <div class="alert alert-warning">
   *   Keep in mind that extending the built-in lists of elements may expose your app to XSS or
   *   other vulnerabilities. Be very mindful of the elements you add.
   * </div>
   *
   * @param {Array<String>|Object} elements - A list of valid HTML elements or an object with one or
   *   more of the following properties:
   *   - **htmlElements** - `{Array<String>}` - A list of elements to extend the current list of
   *     HTML elements.
   *   - **htmlVoidElements** - `{Array<String>}` - A list of elements to extend the current list of
   *     void HTML elements; i.e. elements that do not have an end tag.
   *   - **svgElements** - `{Array<String>}` - A list of elements to extend the current list of SVG
   *     elements. The list of SVG elements is only taken into account if SVG is
   *     {@link ngSanitize.$sanitizeProvider#enableSvg enabled} for `$sanitize`.
   *
   * Passing an array (`[...]`) is equivalent to passing `{htmlElements: [...]}`.
   *
   * @return {$sanitizeProvider} Returns self for chaining.
   */
  this.addValidElements = function (elements) {
    if (!hasBeenInstantiated) {
      if (isArray(elements)) {
        elements = { htmlElements: elements };
      }

      addElementsTo(svgElements, elements.svgElements);
      addElementsTo(voidElements, elements.htmlVoidElements);
      addElementsTo(validElements, elements.htmlVoidElements);
      addElementsTo(validElements, elements.htmlElements);
    }

    return this;
  };

  /**
   * @ngdoc method
   * @name $sanitizeProvider#addValidAttrs
   * @kind function
   *
   * @description
   * Extends the built-in list of valid attributes, i.e. attributes that are considered safe and are
   * not stripped off during sanitization.
   *
   * **Note**:
   * The new attributes will not be treated as URI attributes, which means their values will not be
   * sanitized as URIs using `$compileProvider`'s
   * {@link ng.$compileProvider#aHrefSanitizationTrustedUrlList aHrefSanitizationTrustedUrlList} and
   * {@link ng.$compileProvider#imgSrcSanitizationTrustedUrlList imgSrcSanitizationTrustedUrlList}.
   *
   * <div class="alert alert-info">
   *   This method must be called during the {@link angular.IModule#config config} phase. Once the
   *   `$sanitize` service has been instantiated, this method has no effect.
   * </div>
   *
   * <div class="alert alert-warning">
   *   Keep in mind that extending the built-in list of attributes may expose your app to XSS or
   *   other vulnerabilities. Be very mindful of the attributes you add.
   * </div>
   *
   * @param {Array<String>} attrs - A list of valid attributes.
   *
   * @returns {$sanitizeProvider} Returns self for chaining.
   */
  this.addValidAttrs = function (attrs) {
    if (!hasBeenInstantiated) {
      extend(validAttrs, arrayToMap(attrs, true));
    }
    return this;
  };

  /// ///////////////////////////////////////////////////////////////////////////////////////////////
  // Private stuff
  /// ///////////////////////////////////////////////////////////////////////////////////////////////

  htmlParser = htmlParserImpl;
  htmlSanitizeWriter = htmlSanitizeWriterImpl;

  nodeContains =
    window.Node.prototype.contains ||
    function (arg) {
      // eslint-disable-next-line no-bitwise
      return !!(this.compareDocumentPosition(arg) & 16);
    };

  // Regular Expressions for parsing tags and attributes
  const SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
  // Match everything outside of normal chars and " (quote character)
  const NON_ALPHANUMERIC_REGEXP = /([^#-~ |!])/g;

  // Good source of info about elements and attributes
  // http://dev.w3.org/html5/spec/Overview.html#semantics
  // http://simon.html5.org/html-elements

  // Safe Void Elements - HTML5
  // http://dev.w3.org/html5/spec/Overview.html#void-elements
  let voidElements = stringToMap("area,br,col,hr,img,wbr");

  // Elements that you can, intentionally, leave open (and which close themselves)
  // http://dev.w3.org/html5/spec/Overview.html#optional-tags
  const optionalEndTagBlockElements = stringToMap(
    "colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr",
  );
  const optionalEndTagInlineElements = stringToMap("rp,rt");
  const optionalEndTagElements = extend(
    {},
    optionalEndTagInlineElements,
    optionalEndTagBlockElements,
  );

  // Safe Block Elements - HTML5
  const blockElements = extend(
    {},
    optionalEndTagBlockElements,
    stringToMap(
      "address,article," +
        "aside,blockquote,caption,center,del,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5," +
        "h6,header,hgroup,hr,ins,map,menu,nav,ol,pre,section,table,ul",
    ),
  );

  // Inline Elements - HTML5
  const inlineElements = extend(
    {},
    optionalEndTagInlineElements,
    stringToMap(
      "a,abbr,acronym,b," +
        "bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,q,ruby,rp,rt,s," +
        "samp,small,span,strike,strong,sub,sup,time,tt,u,var",
    ),
  );

  // SVG Elements
  // https://wiki.whatwg.org/wiki/Sanitization_rules#svg_Elements
  // Note: the elements animate,animateColor,animateMotion,animateTransform,set are intentionally omitted.
  // They can potentially allow for arbitrary javascript to be executed. See #11290
  let svgElements = stringToMap(
    "circle,defs,desc,ellipse,font-face,font-face-name,font-face-src,g,glyph," +
      "hkern,image,linearGradient,line,marker,metadata,missing-glyph,mpath,path,polygon,polyline," +
      "radialGradient,rect,stop,svg,switch,text,title,tspan",
  );

  // Blocked Elements (will be stripped)
  const blockedElements = stringToMap("script,style");

  let validElements = extend(
    {},
    voidElements,
    blockElements,
    inlineElements,
    optionalEndTagElements,
  );

  // Attributes that have href and hence need to be sanitized
  const uriAttrs = stringToMap(
    "background,cite,href,longdesc,src,xlink:href,xml:base",
  );

  const htmlAttrs = stringToMap(
    "abbr,align,alt,axis,bgcolor,border,cellpadding,cellspacing,class,clear," +
      "color,cols,colspan,compact,coords,dir,face,headers,height,hreflang,hspace," +
      "ismap,lang,language,nohref,nowrap,rel,rev,rows,rowspan,rules," +
      "scope,scrolling,shape,size,span,start,summary,tabindex,target,title,type," +
      "valign,value,vspace,width",
  );

  // SVG attributes (without "id" and "name" attributes)
  // https://wiki.whatwg.org/wiki/Sanitization_rules#svg_Attributes
  const svgAttrs = stringToMap(
    "accent-height,accumulate,additive,alphabetic,arabic-form,ascent," +
      "baseProfile,bbox,begin,by,calcMode,cap-height,class,color,color-rendering,content," +
      "cx,cy,d,dx,dy,descent,display,dur,end,fill,fill-rule,font-family,font-size,font-stretch," +
      "font-style,font-variant,font-weight,from,fx,fy,g1,g2,glyph-name,gradientUnits,hanging," +
      "height,horiz-adv-x,horiz-origin-x,ideographic,k,keyPoints,keySplines,keyTimes,lang," +
      "marker-end,marker-mid,marker-start,markerHeight,markerUnits,markerWidth,mathematical," +
      "max,min,offset,opacity,orient,origin,overline-position,overline-thickness,panose-1," +
      "path,pathLength,points,preserveAspectRatio,r,refX,refY,repeatCount,repeatDur," +
      "requiredExtensions,requiredFeatures,restart,rotate,rx,ry,slope,stemh,stemv,stop-color," +
      "stop-opacity,strikethrough-position,strikethrough-thickness,stroke,stroke-dasharray," +
      "stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,stroke-opacity," +
      "stroke-width,systemLanguage,target,text-anchor,to,transform,type,u1,u2,underline-position," +
      "underline-thickness,unicode,unicode-range,units-per-em,values,version,viewBox,visibility," +
      "width,widths,x,x-height,x1,x2,xlink:actuate,xlink:arcrole,xlink:role,xlink:show,xlink:title," +
      "xlink:type,xml:base,xml:lang,xml:space,xmlns,xmlns:xlink,y,y1,y2,zoomAndPan",
    true,
  );

  let validAttrs = extend({}, uriAttrs, svgAttrs, htmlAttrs);

  function stringToMap(str, lowercaseKeys) {
    return arrayToMap(str.split(","), lowercaseKeys);
  }

  function arrayToMap(items, lowercaseKeys) {
    const obj = {};
    let i;
    for (i = 0; i < items.length; i++) {
      obj[lowercaseKeys ? lowercase(items[i]) : items[i]] = true;
    }
    return obj;
  }

  function addElementsTo(elementsMap, newElements) {
    if (newElements && newElements.length) {
      extend(elementsMap, arrayToMap(newElements));
    }
  }

  /**
   * Create an inert document that contains the dirty HTML that needs sanitizing.
   * We use the DOMParser API by default and fall back to createHTMLDocument if DOMParser is not
   * available.
   */
  const getInertBodyElement /* function(html: string): HTMLBodyElement */ =
    (function (window, document) {
      if (isDOMParserAvailable()) {
        return getInertBodyElement_DOMParser;
      }

      if (!document || !document.implementation) {
        throw $sanitizeMinErr("noinert", "Can't create an inert html document");
      }
      const inertDocument = document.implementation.createHTMLDocument("inert");
      const inertBodyElement =
        inertDocument.documentElement.querySelector("body");
      return getInertBodyElement_InertDocument;

      function isDOMParserAvailable() {
        try {
          return !!getInertBodyElement_DOMParser("");
        } catch (e) {
          return false;
        }
      }

      function getInertBodyElement_DOMParser(html) {
        // We add this dummy element to ensure that the rest of the content is parsed as expected
        // e.g. leading whitespace is maintained and tags like `<meta>` do not get hoisted to the `<head>` tag.
        html = `<remove></remove>${html}`;
        try {
          const { body } = new window.DOMParser().parseFromString(
            html,
            "text/html",
          );
          body.firstChild.remove();
          return body;
        } catch (e) {
          return undefined;
        }
      }

      function getInertBodyElement_InertDocument(html) {
        inertBodyElement.innerHTML = html;
        return inertBodyElement;
      }
    })(window, window.document);

  /**
   * @example
   * htmlParser(htmlString, {
   *     start: function(tag, attrs) {},
   *     end: function(tag) {},
   *     chars: function(text) {},
   *     comment: function(text) {}
   * });
   *
   * @param {string} html string
   * @param {object} handler
   */
  function htmlParserImpl(html, handler) {
    if (html === null || html === undefined) {
      html = "";
    } else if (typeof html !== "string") {
      html = `${html}`;
    }

    let inertBodyElement = getInertBodyElement(html);
    if (!inertBodyElement) return "";

    // mXSS protection
    let mXSSAttempts = 5;
    do {
      if (mXSSAttempts === 0) {
        throw $sanitizeMinErr(
          "uinput",
          "Failed to sanitize html because the input is unstable",
        );
      }
      mXSSAttempts--;

      // trigger mXSS if it is going to happen by reading and writing the innerHTML
      html = inertBodyElement.innerHTML;
      inertBodyElement = getInertBodyElement(html);
    } while (html !== inertBodyElement.innerHTML);

    let node = inertBodyElement.firstChild;
    while (node) {
      switch (node.nodeType) {
        case 1: // ELEMENT_NODE
          handler.start(
            node.nodeName.toLowerCase(),
            attrToMap(node.attributes),
          );
          break;
        case 3: // TEXT NODE
          handler.chars(node.textContent);
          break;
      }

      let nextNode;
      if (!(nextNode = node.firstChild)) {
        if (node.nodeType === 1) {
          handler.end(node.nodeName.toLowerCase());
        }
        nextNode = getNonDescendant("nextSibling", node);
        if (!nextNode) {
          while (nextNode == null) {
            node = getNonDescendant("parentNode", node);
            if (node === inertBodyElement) break;
            nextNode = getNonDescendant("nextSibling", node);
            if (node.nodeType === 1) {
              handler.end(node.nodeName.toLowerCase());
            }
          }
        }
      }
      node = nextNode;
    }

    while ((node = inertBodyElement.firstChild)) {
      inertBodyElement.removeChild(node);
    }
  }

  function attrToMap(attrs) {
    const map = {};
    for (let i = 0, ii = attrs.length; i < ii; i++) {
      const attr = attrs[i];
      map[attr.name] = attr.value;
    }
    return map;
  }

  /**
   * Escapes all potentially dangerous characters, so that the
   * resulting string can be safely inserted into attribute or
   * element text.
   * @param value
   * @returns {string} escaped text
   */
  function encodeEntities(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(SURROGATE_PAIR_REGEXP, (value) => {
        const hi = value.charCodeAt(0);
        const low = value.charCodeAt(1);
        return `&#${(hi - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000};`;
      })
      .replace(NON_ALPHANUMERIC_REGEXP, (value) => `&#${value.charCodeAt(0)};`)
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /**
   * create an HTML/XML writer which writes to buffer
   * @param {Array} buf use buf.join('') to get out sanitized html string
   * @returns {object} in the form of {
   *     start: function(tag, attrs) {},
   *     end: function(tag) {},
   *     chars: function(text) {},
   *     comment: function(text) {}
   * }
   */
  function htmlSanitizeWriterImpl(buf, uriValidator) {
    let ignoreCurrentElement = false;
    const out = bind(buf, buf.push);
    return {
      start(tag, attrs) {
        tag = lowercase(tag);
        if (!ignoreCurrentElement && blockedElements[tag]) {
          ignoreCurrentElement = tag;
        }
        if (!ignoreCurrentElement && validElements[tag] === true) {
          out("<");
          out(tag);
          forEach(attrs, (value, key) => {
            const lkey = lowercase(key);
            const isImage =
              (tag === "img" && lkey === "src") || lkey === "background";
            if (
              validAttrs[lkey] === true &&
              (uriAttrs[lkey] !== true || uriValidator(value, isImage))
            ) {
              out(" ");
              out(key);
              out('="');
              out(encodeEntities(value));
              out('"');
            }
          });
          out(">");
        }
      },
      end(tag) {
        tag = lowercase(tag);
        if (
          !ignoreCurrentElement &&
          validElements[tag] === true &&
          voidElements[tag] !== true
        ) {
          out("</");
          out(tag);
          out(">");
        }
        // eslint-disable-next-line eqeqeq
        if (tag == ignoreCurrentElement) {
          ignoreCurrentElement = false;
        }
      },
      chars(chars) {
        if (!ignoreCurrentElement) {
          out(encodeEntities(chars));
        }
      },
    };
  }

  /**
   * When IE9-11 comes across an unknown namespaced attribute e.g. 'xlink:foo' it adds 'xmlns:ns1' attribute to declare
   * ns1 namespace and prefixes the attribute with 'ns1' (e.g. 'ns1:xlink:foo'). This is undesirable since we don't want
   * to allow any of these custom attributes. This method strips them all.
   *
   * @param node Root element to process
   */
  function stripCustomNsAttrs(node) {
    while (node) {
      if (node.nodeType === window.Node.ELEMENT_NODE) {
        const attrs = node.attributes;
        for (let i = 0, l = attrs.length; i < l; i++) {
          const attrNode = attrs[i];
          const attrName = attrNode.name.toLowerCase();
          if (
            attrName === "xmlns:ns1" ||
            attrName.lastIndexOf("ns1:", 0) === 0
          ) {
            node.removeAttributeNode(attrNode);
            i--;
            l--;
          }
        }
      }

      const nextNode = node.firstChild;
      if (nextNode) {
        stripCustomNsAttrs(nextNode);
      }

      node = getNonDescendant("nextSibling", node);
    }
  }

  function getNonDescendant(propName, node) {
    // An element is clobbered if its `propName` property points to one of its descendants
    const nextNode = node[propName];
    if (nextNode && nodeContains.call(node, nextNode)) {
      throw $sanitizeMinErr(
        "elclob",
        "Failed to sanitize html because the element is clobbered: {0}",
        node.outerHTML || node.outerText,
      );
    }
    return nextNode;
  }
}

export function sanitizeText(chars) {
  const buf = [];
  const writer = htmlSanitizeWriter(buf, () => {});
  writer.chars(chars);
  return buf.join("");
}
