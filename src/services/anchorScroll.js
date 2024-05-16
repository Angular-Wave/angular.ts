import {
  isElement,
  isFunction,
  isNumber,
  isString,
  nodeName_,
} from "../core/utils";

export function AnchorScrollProvider() {
  let autoScrollingEnabled = true;

  this.disableAutoScrolling = () => {
    autoScrollingEnabled = false;
  };

  this.$get = [
    "$location",
    "$rootScope",
    /**
     *
     * @param {angular.IRootScopeService} $location
     * @param {*} $rootScope
     * @returns
     */
    function ($location, $rootScope) {
      const { document } = window;

      // Helper function to get first anchor from a NodeList
      // (using `Array#some()` instead of `angular#forEach()` since it's more performant
      //  and working in all supported browsers.)
      function getFirstAnchor(list) {
        let result = null;
        Array.prototype.some.call(list, (element) => {
          if (nodeName_(element) === "a") {
            result = element;
            return true;
          }
        });
        return result;
      }

      function getYOffset() {
        let offset = scroll.yOffset;

        if (isFunction(offset)) {
          offset = offset();
        } else if (isElement(offset)) {
          const elem = offset[0];
          const style = window.getComputedStyle(elem);
          if (style.position !== "fixed") {
            offset = 0;
          } else {
            offset = elem.getBoundingClientRect().bottom;
          }
        } else if (!isNumber(offset)) {
          offset = 0;
        }

        return offset;
      }

      function scrollTo(elem) {
        if (elem) {
          elem.scrollIntoView();

          const offset = getYOffset();

          if (offset) {
            // `offset` is the number of pixels we should scroll UP in order to align `elem` properly.
            // This is true ONLY if the call to `elem.scrollIntoView()` initially aligns `elem` at the
            // top of the viewport.
            //
            // IF the number of pixels from the top of `elem` to the end of the page's content is less
            // than the height of the viewport, then `elem.scrollIntoView()` will align the `elem` some
            // way down the page.
            //
            // This is often the case for elements near the bottom of the page.
            //
            // In such cases we do not need to scroll the whole `offset` up, just the difference between
            // the top of the element and the offset, which is enough to align the top of `elem` at the
            // desired position.
            const elemTop = elem.getBoundingClientRect().top;
            window.scrollBy(0, elemTop - offset);
          }
        } else {
          window.scrollTo(0, 0);
        }
      }

      function scroll(hash) {
        // Allow numeric hashes
        hash = isString(hash)
          ? hash
          : isNumber(hash)
            ? hash.toString()
            : $location.hash();
        let elm;

        // empty hash, scroll to the top of the page
        if (!hash) scrollTo(null);
        // element with given id
        else if ((elm = document.getElementById(hash))) scrollTo(elm);
        // first anchor with given name :-D
        else if ((elm = getFirstAnchor(document.getElementsByName(hash))))
          scrollTo(elm);
        // no element and hash === 'top', scroll to the top of the page
        else if (hash === "top") scrollTo(null);
      }

      // does not scroll when user clicks on anchor link that is currently on
      // (no url change, no $location.hash() change), browser native does scroll
      if (autoScrollingEnabled) {
        $rootScope.$watch(
          () => $location.hash(),
          (newVal, oldVal) => {
            // skip the initial scroll if $location.hash is empty
            if (newVal === oldVal && newVal === "") return;

            const action = () => $rootScope.$evalAsync(scroll);
            if (window.document.readyState === "complete") {
              // Force the action to be run async for consistent behavior
              // from the action's point of view
              // i.e. it will definitely not be in a $apply
              window.setTimeout(() => action());
            } else {
              window.addEventListener("load", () => action());
            }
          },
        );
      }

      return scroll;
    },
  ];
}
