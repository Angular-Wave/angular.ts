/**
 * @returns
 */
export function createHttpBackend(): (
  method: string,
  url?: string,
  post?: any,
  callback?: (
    arg0: number,
    arg1: any,
    arg2: string | null,
    arg3: string,
    arg4: string,
  ) => void,
  headers?: {
    [x: string]: string;
  },
  timeout?: number | Promise<any>,
  withCredentials?: boolean,
  responseType?: XMLHttpRequestResponseType,
  eventHandlers?: {
    [x: string]: EventListener;
  },
  uploadEventHandlers?: {
    [x: string]: EventListener;
  },
) => void;
/**
 * HTTP backend used by the `$http` that delegates to
 * XMLHttpRequest object and deals with browser incompatibilities.
 * You should never need to use this service directly.
 */
export class HttpBackendProvider {
  $get: () => (
    method: string,
    url?: string,
    post?: any,
    callback?: (
      arg0: number,
      arg1: any,
      arg2: string | null,
      arg3: string,
      arg4: string,
    ) => void,
    headers?: {
      [x: string]: string;
    },
    timeout?: number | Promise<any>,
    withCredentials?: boolean,
    responseType?: XMLHttpRequestResponseType,
    eventHandlers?: {
      [x: string]: EventListener;
    },
    uploadEventHandlers?: {
      [x: string]: EventListener;
    },
  ) => void;
}
