/**
 * Possible values for `data-swap` attribute
 */
export declare const SwapMode: {
  /** (default) Replaces the contents inside the element */
  readonly innerHTML: "innerHTML";
  /** Replaces the entire element, including the tag itself */
  readonly outerHTML: "outerHTML";
  /** Inserts plain text (without parsing HTML) */
  readonly textContent: "textContent";
  /** Inserts HTML immediately before the element itself */
  readonly beforebegin: "beforebegin";
  /** Inserts HTML inside the element, before its first child */
  readonly afterbegin: "afterbegin";
  /** Inserts HTML inside the element, after its last child */
  readonly beforeend: "beforeend";
  /** Inserts HTML immediately after the element itself */
  readonly afterend: "afterend";
  /** Removes the element entirely */
  readonly delete: "delete";
  /** Performs no insertion (no-op) */
  readonly none: "none";
};
/**
 * Union type representing all possible DOM insertion modes.
 */
export type SwapModeType = keyof typeof SwapMode;
