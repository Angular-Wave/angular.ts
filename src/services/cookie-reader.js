import { isUndefined } from "../shared/utils";

let lastCookies = {};
let lastCookieString = "";

/**
 * @returns {Object<String, String>} List of all cookies
 */
export function getCookies() {
  let cookieArray;
  let cookie;
  let i;
  let index;
  let name;
  const currentCookieString = window.document.cookie;

  if (currentCookieString !== lastCookieString) {
    lastCookieString = currentCookieString;
    cookieArray = lastCookieString.split("; ");
    lastCookies = {};

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
}

function safeDecodeURIComponent(str) {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
}
