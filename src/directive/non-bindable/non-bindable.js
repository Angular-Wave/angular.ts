/**
 * @returns {import('../../interface.ts').Directive}
 */
export function ngNonBindableDirective() {
  return {
    terminal: true,
    priority: 1000,
  };
}
