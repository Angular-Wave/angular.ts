/\*\*

- The $location service parses the URL in the browser address bar (based on the
- [window.location](https://developer.mozilla.org/en/window.location)) and makes the URL
- available to your application. Changes to the URL in the address bar are reflected into
- $location service and changes to $location are reflected into the browser address bar.
-
- **The $location service:**
-
- - Exposes the current URL in the browser address bar, so you can
- - Watch and observe the URL.
- - Change the URL.
- - Synchronizes the URL with the browser when the user
- - Changes the address bar.
- - Clicks the back or forward button (or clicks a History link).
- - Clicks on a link.
- - Represents the URL object as a set of methods (protocol, host, port, path, search, hash).
-
- For more information see {@link guide/$location Developer Guide: Using $location}
  \*/

/\*\*

- Use the `$locationProvider` to configure how the application deep linking paths are stored.
  \*/

/\*\*

- @ngdoc event
- @name $location#$locationChangeStart
- @eventType broadcast on root scope
- @description
- Broadcasted before a URL will change.
-
- This change can be prevented by calling
- `preventDefault` method of the event. See {@link ng.$rootScope.Scope#$on} for more
- details about event object. Upon successful change
- {@link ng.$location#$locationChangeSuccess $locationChangeSuccess} is fired.
-
- The `newState` and `oldState` parameters may be defined only in HTML5 mode and when
- the browser supports the HTML5 History API.
-
- @param {Object} angularEvent Synthetic event object.
- @param {string} newUrl New URL
- @param {string=} oldUrl URL that was before it was changed.
- @param {string=} newState New history state object
- @param {string=} oldState History state object that was before it was changed.
  \*/

/\*\*

- @ngdoc event
- @name $location#$locationChangeSuccess
- @eventType broadcast on root scope
- @description
- Broadcasted after a URL was changed.
-
- The `newState` and `oldState` parameters may be defined only in HTML5 mode and when
- the browser supports the HTML5 History API.
-
- @param {Object} angularEvent Synthetic event object.
- @param {string} newUrl New URL
- @param {string=} oldUrl URL that was before it was changed.
- @param {string=} newState New history state object
- @param {string=} oldState History state object that was before it was changed.
  \*/

  /\*\*

  - This method is getter / setter.
  -
  - Return search part (as object) of current URL when called without any parameter.
  -
  - Change search part when called with parameter and return `$location`.
  -
  -
  - ```js

    ```

  - // given URL http://example.com/#/some/path?foo=bar&baz=xoxo
  - let searchObject = $location.search();
  - // => {foo: 'bar', baz: 'xoxo'}
  -
  - // set foo to 'yipee'
  - $location.search('foo', 'yipee');
  - // $location.search() => {foo: 'yipee', baz: 'xoxo'}
  - ```

    ```

  -
  - @param {string|Object} search New search params - string or hash object.
  -
  - When called with a single argument the method acts as a setter, setting the `search` component
  - of `$location` to the specified value.
  -
  - If the argument is a hash object containing an array of values, these values will be encoded
  - as duplicate search parameters in the URL.
  -
  - @param {(string|Number|Array<string>|boolean)=} paramValue If `search` is a string or number, then `paramValue`
  - will override only a single search property.
  -
  - If `paramValue` is an array, it will override the property of the `search` component of
  - `$location` specified via the first argument.
  -
  - If `paramValue` is `null`, the property specified via the first argument will be deleted.
  -
  - If `paramValue` is `true`, the property specified via the first argument will be added with no
  - value nor trailing equal sign.
  -
  - @return {Object} If called with no arguments returns the parsed `search` object. If called with
  - one or more arguments returns `$location` object itself.
    \*/
