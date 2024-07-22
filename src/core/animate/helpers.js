/**
 * Apply inline styles to element
 * @param {HTMLElement} element
 * @param {Object<string, string>} styles
 */
export function addInlineStyles(element, styles) {
  for (const property in styles) {
    element.style[property] = styles[property];
  }
}
