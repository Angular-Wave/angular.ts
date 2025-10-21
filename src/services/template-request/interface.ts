export interface TemplateRequestService {
  /**
   * Downloads a template using $http and, upon success, stores the
   * contents inside of $templateCache.
   *
   * If the HTTP request fails or the response data of the HTTP request is
   * empty then a $compile error will be thrown (unless
   * {ignoreRequestError} is set to true).
   *
   * @param tpl                  The template URL.
   * @param ignoreRequestError   Whether or not to ignore the exception
   *                             when the request fails or the template is
   *                             empty.
   *
   * @return   A promise whose value is the template content.
   */
  (tpl: string, ignoreRequestError?: boolean): Promise<string>;

  /**
   * total amount of pending template requests being downloaded.
   */
  totalPendingRequests: number;
}
