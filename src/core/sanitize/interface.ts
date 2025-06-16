/**
 * Sanitizer function that processes a URI string and optionally
 * treats it as a media URL.
 */
export interface SanitizerFn {
  (
    uri: string | null | undefined,
    isMediaUrl?: boolean,
  ): string | null | undefined;
}
