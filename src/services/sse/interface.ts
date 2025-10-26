/**
 * Configuration object for SSE
 */
export interface SseConfig {
  withCredentials?: boolean;
  headers?: Record<string, string>;
  onOpen?: (event: Event) => void;
  onMessage?: (data: any, event: MessageEvent) => void;
  onError?: (err: Event) => void;
  transformMessage?: (data: string) => any;
  params?: Record<string, any>;
}

/**
 * $sse service type
 */
export type SseService = (url: string, config?: SseConfig) => EventSource;
