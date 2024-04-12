import { isUndefined } from "./utils";

/**
 * @name $$cookieReader
 * @requires $document
 *
 * @description
 * This is a private service for reading cookies used by $http and ngCookies
 *
 * @return {Object} a key/value map of the current cookies
 */
export function $$CookieReader($document) {
  const rawDocument = $document[0] || {};
  let lastCookies = {};
  let lastCookieString = "";

  function safeGetCookie(rawDocument) {
    try {
      return rawDocument.cookie || "";
    } catch (e) {
      return "";
    }
  }

  function safeDecodeURIComponent(str) {
    try {
      return decodeURIComponent(str);
    } catch (e) {
      return str;
    }
  }

  return function () {
    let cookieArray;
    let cookie;
    let i;
    let index;
    let name;
    const currentCookieString = safeGetCookie(rawDocument);

    if (currentCookieString !== lastCookieString) {
      lastCookieString = currentCookieString;
      cookieArray = lastCookieString.split("; ");
      lastCookies = {};

      // eslint-disable-next-line no-plusplus
      for (i = 0; i < cookieArray.length; i++) {
        cookie = cookieArray[i];
        index = cookie.indexOf("=");
        if (index > 0) {
          // ignore nameless cookies
          name = safeDecodeURIComponent(cookie.substring(0, index));
          // the first value that is seen for a cookie is the most
          // specific one.  values for the same cookie name that
          // follow are for less specific paths.
          if (isUndefined(lastCookies[name])) {
            lastCookies[name] = safeDecodeURIComponent(
              cookie.substring(index + 1),
            );
          }
        }
      }
    }
    return lastCookies;
  };
}

$$CookieReader.$inject = ["$document"];

export function CookieReaderProvider() {
  this.$get = $$CookieReader;
}
