import { getOrSetCacheData, setCacheData } from "../shared/dom.js";
import {
  isUndefined,
  isObject,
  isString,
  isElement,
  isDefined,
  extend,
} from "../shared/utils.js";
import {
  NG_ANIMATE_CHILDREN_DATA,
  applyAnimationClassesFactory,
  applyAnimationStyles,
  applyGeneratedPreparationClasses,
  assertArg,
  clearGeneratedClasses,
  extractElementNode,
  mergeAnimationDetails,
  prepareAnimationOptions,
  stripCommentsFromElement,
} from "./shared.js";

const NG_ANIMATE_ATTR_NAME = "data-ng-animate";
const NG_ANIMATE_PIN_DATA = "$ngAnimatePin";
AnimateQueueProvider.$inject = ["$animateProvider"];
export function AnimateQueueProvider($animateProvider) {
  const PRE_DIGEST_STATE = 1;
  const RUNNING_STATE = 2;
  const ONE_SPACE = " ";

  const rules = (this.rules = {
    skip: [],
    cancel: [],
    join: [],
  });

  function getEventData(options) {
    return {
      addClass: options.addClass,
      removeClass: options.removeClass,
      from: options.from,
      to: options.to,
    };
  }

  function makeTruthyCssClassMap(classString) {
    if (!classString) {
      return null;
    }

    const keys = classString.split(ONE_SPACE);
    const map = Object.create(null);

    keys.forEach((key) => {
      map[key] = true;
    });
    return map;
  }

  function hasMatchingClasses(newClassString, currentClassString) {
    if (newClassString && currentClassString) {
      const currentClassMap = makeTruthyCssClassMap(currentClassString);
      return newClassString
        .split(ONE_SPACE)
        .some((className) => currentClassMap[className]);
    }
  }

  function isAllowed(ruleType, currentAnimation, previousAnimation) {
    return rules[ruleType].some((fn) =>
      fn(currentAnimation, previousAnimation),
    );
  }

  function hasAnimationClasses(animation, and) {
    const a = (animation.addClass || "").length > 0;
    const b = (animation.removeClass || "").length > 0;
    return and ? a && b : a || b;
  }

  rules.join.push(
    (newAnimation) =>
      // if the new animation is class-based then we can just tack that on
      !newAnimation.structural && hasAnimationClasses(newAnimation),
  );

  rules.skip.push(
    (newAnimation) =>
      // there is no need to animate anything if no classes are being added and
      // there is no structural animation that will be triggered
      !newAnimation.structural && !hasAnimationClasses(newAnimation),
  );

  rules.skip.push(
    (newAnimation, currentAnimation) =>
      // why should we trigger a new structural animation if the element will
      // be removed from the DOM anyway?
      currentAnimation.event === "leave" && newAnimation.structural,
  );

  rules.skip.push(
    (newAnimation, currentAnimation) =>
      // if there is an ongoing current animation then don't even bother running the class-based animation
      currentAnimation.structural &&
      currentAnimation.state === RUNNING_STATE &&
      !newAnimation.structural,
  );

  rules.cancel.push(
    (newAnimation, currentAnimation) =>
      // there can never be two structural animations running at the same time
      currentAnimation.structural && newAnimation.structural,
  );

  rules.cancel.push(
    (newAnimation, currentAnimation) =>
      // if the previous animation is already running, but the new animation will
      // be triggered, but the new animation is structural
      currentAnimation.state === RUNNING_STATE && newAnimation.structural,
  );

  rules.cancel.push((newAnimation, currentAnimation) => {
    // cancel the animation if classes added / removed in both animation cancel each other out,
    // but only if the current animation isn't structural

    if (currentAnimation.structural) return false;

    const nA = newAnimation.addClass;
    const nR = newAnimation.removeClass;
    const cA = currentAnimation.addClass;
    const cR = currentAnimation.removeClass;

    // early detection to save the global CPU shortage :)
    if (
      (isUndefined(nA) && isUndefined(nR)) ||
      (isUndefined(cA) && isUndefined(cR))
    ) {
      return false;
    }

    return hasMatchingClasses(nA, cR) || hasMatchingClasses(nR, cA);
  });

  this.$get = [
    "$rootScope",
    "$injector",
    "$$animation",
    "$$AnimateRunner",
    "$templateRequest",
    /**
     *
     * @param {import('../core/scope/scope.js').Scope} $rootScope
     * @param {*} $injector
     * @param {*} $$animation
     * @param {*} $$AnimateRunner
     * @param {*} $templateRequest
     * @returns
     */
    function (
      $rootScope,
      $injector,
      $$animation,
      $$AnimateRunner,
      $templateRequest,
    ) {
      const activeAnimationsLookup = new Map();
      const disabledElementsLookup = new Map();
      let animationsEnabled = null;

      function removeFromDisabledElementsLookup(evt) {
        disabledElementsLookup.delete(evt.target);
      }

      function postDigestTaskFactory() {
        let postDigestCalled = false;
        return function (fn) {
          // we only issue a call to postDigest before
          // it has first passed. This prevents any callbacks
          // from not firing once the animation has completed
          // since it will be out of the digest cycle.
          if (postDigestCalled) {
            fn();
          } else {
            $rootScope.$postUpdate(() => {
              postDigestCalled = true;
              fn();
            });
          }
        };
      }

      // Wait until all directive and route-related templates are downloaded and
      // compiled. The $templateRequest.totalPendingRequests variable keeps track of
      // all of the remote templates being currently downloaded. If there are no
      // templates currently downloading then the watcher will still fire anyway.
      $rootScope["templateRequest"] = $templateRequest;
      const deregisterWatch = $rootScope.$watch(
        "$templateRequest.totalPendingRequests",
        (val) => {
          if (val === 0) {
            deregisterWatch();
            $rootScope["$templateRequest"] = undefined;
            // Now that all templates have been downloaded, $animate will wait until
            // the post digest queue is empty before enabling animations. By having two
            // calls to $postDigest calls we can ensure that the flag is enabled at the
            // very end of the post digest queue. Since all of the animations in $animate
            // use $postDigest, it's important that the code below executes at the end.
            // This basically means that the page is fully downloaded and compiled before
            // any animations are triggered.
            $rootScope.$postUpdate(() => {
              $rootScope.$postUpdate(() => {
                // we check for null directly in the event that the application already called
                // .enabled() with whatever arguments that it provided it with
                if (animationsEnabled === null) {
                  animationsEnabled = true;
                }
              });
            });
          }
        },
        true,
      );

      const callbackRegistry = Object.create(null);

      // remember that the `customFilter`/`classNameFilter` are set during the
      // provider/config stage therefore we can optimize here and setup helper functions
      const customFilter = $animateProvider.customFilter();
      const classNameFilter = $animateProvider.classNameFilter();
      const returnTrue = function () {
        return true;
      };

      const isAnimatableByFilter = customFilter || returnTrue;
      const isAnimatableClassName = !classNameFilter
        ? returnTrue
        : function (node, options) {
            const className = [
              node.getAttribute("class"),
              options.addClass,
              options.removeClass,
            ].join(" ");
            return classNameFilter.test(className);
          };

      const applyAnimationClasses = applyAnimationClassesFactory();

      function normalizeAnimationDetails(element, animation) {
        return mergeAnimationDetails(element, animation, {});
      }

      // IE9-11 has no method "contains" in SVG element and in Node.prototype. Bug #10259.
      const contains =
        window.Node.prototype.contains ||
        function (arg) {
          return this === arg || !!(this.compareDocumentPosition(arg) & 16);
        };

      function findCallbacks(targetParentNode, targetNode, event) {
        const matches = [];
        const entries = callbackRegistry[event];
        if (entries) {
          entries.forEach((entry) => {
            if (contains.call(entry.node, targetNode)) {
              matches.push(entry.callback);
            } else if (
              event === "leave" &&
              contains.call(entry.node, targetParentNode)
            ) {
              matches.push(entry.callback);
            }
          });
        }

        return matches;
      }

      function filterFromRegistry(list, matchContainer, matchCallback) {
        const containerNode = extractElementNode(matchContainer);
        return list.filter((entry) => {
          const isMatch =
            entry.node === containerNode &&
            (!matchCallback || entry.callback === matchCallback);
          return !isMatch;
        });
      }

      function cleanupEventListeners(phase, node) {
        if (phase === "close" && !node.parentNode) {
          // If the element is not attached to a parentNode, it has been removed by
          // the domOperation, and we can safely remove the event callbacks
          $animate.off(node);
        }
      }

      let $animate = {
        on(event, container, callback) {
          const node = extractElementNode(container);
          callbackRegistry[event] = callbackRegistry[event] || [];
          callbackRegistry[event].push({
            node,
            callback,
          });

          // Remove the callback when the element is removed from the DOM
          container.addEventListener("$destroy", () => {
            const animationDetails = activeAnimationsLookup.get(node);

            if (!animationDetails) {
              // If there's an animation ongoing, the callback calling code will remove
              // the event listeners. If we'd remove here, the callbacks would be removed
              // before the animation ends
              $animate.off(event, container, callback);
            }
          });
        },

        off(event, container, callback) {
          if (arguments.length === 1 && !isString(arguments[0])) {
            container = arguments[0];
            for (const eventType in callbackRegistry) {
              callbackRegistry[eventType] = filterFromRegistry(
                callbackRegistry[eventType],
                container,
              );
            }

            return;
          }

          const entries = callbackRegistry[event];
          if (!entries) return;

          callbackRegistry[event] =
            arguments.length === 1
              ? null
              : filterFromRegistry(entries, container, callback);
        },

        pin(element, parentElement) {
          assertArg(isElement(element), "element", "not an element");
          assertArg(
            isElement(parentElement),
            "parentElement",
            "not an element",
          );
          setCacheData(element, NG_ANIMATE_PIN_DATA, parentElement);
        },

        push(element, event, options, domOperation) {
          options = options || {};
          options.domOperation = domOperation;
          return queueAnimation(element, event, options);
        },

        // this method has four signatures:
        //  () - global getter
        //  (bool) - global setter
        //  (element) - element getter
        //  (element, bool) - element setter<F37>
        enabled(element, bool) {
          const argCount = arguments.length;

          if (argCount === 0) {
            // () - Global getter
            bool = !!animationsEnabled;
          } else {
            const hasElement = isElement(element);

            if (!hasElement) {
              // (bool) - Global setter
              bool = animationsEnabled = !!element;
            } else {
              const node = element;

              if (argCount === 1) {
                // (element) - Element getter
                bool = !disabledElementsLookup.get(node);
              } else {
                // (element, bool) - Element setter
                if (!disabledElementsLookup.has(node)) {
                  // The element is added to the map for the first time.
                  // Create a listener to remove it on `$destroy` (to avoid memory leak).
                  element.addEventListener(
                    "$destroy",
                    removeFromDisabledElementsLookup,
                  );
                }
                disabledElementsLookup.set(node, !bool);
              }
            }
          }

          return bool;
        },
      };

      return $animate;

      /**
       * @param {Element} originalElement
       * @param {string} event
       * @param {*} initialOptions
       * @returns void
       */
      function queueAnimation(originalElement, event, initialOptions) {
        // we always make a copy of the options since
        // there should never be any side effects on
        // the input data when running `$animateCss`.
        let options = initialOptions;

        // strip comments

        let element = Array.isArray(originalElement)
          ? originalElement.filter((x) => x.nodeName !== "#comment")[0]
          : originalElement;
        const node = element;
        const parentNode = node && node.parentNode;

        options = prepareAnimationOptions(options);

        // we create a fake runner with a working promise.
        // These methods will become available after the digest has passed
        const runner = new $$AnimateRunner();

        // this is used to trigger callbacks in postDigest mode
        const runInNextPostDigestOrNow = postDigestTaskFactory();

        if (Array.isArray(options.addClass)) {
          options.addClass = options.addClass.join(" ");
        }

        if (options.addClass && !isString(options.addClass)) {
          options.addClass = null;
        }

        if (Array.isArray(options.removeClass)) {
          options.removeClass = options.removeClass.join(" ");
        }

        if (options.removeClass && !isString(options.removeClass)) {
          options.removeClass = null;
        }

        if (options.from && !isObject(options.from)) {
          options.from = null;
        }

        if (options.to && !isObject(options.to)) {
          options.to = null;
        }
        // If animations are hard-disabled for the whole application there is no need to continue.
        // There are also situations where a directive issues an animation for a JQLite wrapper that
        // contains only comment nodes. In this case, there is no way we can perform an animation.
        if (
          // !animationsEnabled ||
          !node ||
          !isAnimatableByFilter(node, event, initialOptions) ||
          !isAnimatableClassName(node, options)
        ) {
          close();
          return runner;
        }

        const isStructural = ["enter", "move", "leave"].indexOf(event) >= 0;

        // This is a hard disable of all animations the element itself, therefore  there is no need to
        // continue further past this point if not enabled
        // Animations are also disabled if the document is currently hidden (page is not visible
        // to the user), because browsers slow down or do not flush calls to requestAnimationFrame
        let skipAnimations =
          document.hidden || disabledElementsLookup.get(node);
        const existingAnimation =
          (!skipAnimations && activeAnimationsLookup.get(node)) || {};
        const hasExistingAnimation = !!existingAnimation.state;
        // there is no point in traversing the same collection of parent ancestors if a followup
        // animation will be run on the same element that already did all that checking work
        if (
          !skipAnimations &&
          (!hasExistingAnimation ||
            existingAnimation.state !== PRE_DIGEST_STATE)
        ) {
          skipAnimations = !areAnimationsAllowed(node, parentNode);
        }

        if (skipAnimations) {
          // Callbacks should fire even if the document is hidden (regression fix for issue #14120)
          if (document.hidden)
            notifyProgress(runner, event, "start", getEventData(options));
          close();
          if (document.hidden)
            notifyProgress(runner, event, "close", getEventData(options));
          return runner;
        }

        if (isStructural) {
          closeChildAnimations(node);
        }

        const newAnimation = {
          structural: isStructural,
          element,
          event,
          addClass: options.addClass,
          removeClass: options.removeClass,
          close,
          options,
          runner,
        };

        if (hasExistingAnimation) {
          const skipAnimationFlag = isAllowed(
            "skip",
            newAnimation,
            existingAnimation,
          );
          if (skipAnimationFlag) {
            if (existingAnimation.state === RUNNING_STATE) {
              close();
              return runner;
            }
            mergeAnimationDetails(element, existingAnimation, newAnimation);
            return existingAnimation.runner;
          }
          const cancelAnimationFlag = isAllowed(
            "cancel",
            newAnimation,
            existingAnimation,
          );
          if (cancelAnimationFlag) {
            if (existingAnimation.state === RUNNING_STATE) {
              // this will end the animation right away and it is safe
              // to do so since the animation is already running and the
              // runner callback code will run in async
              existingAnimation.runner.end();
            } else if (existingAnimation.structural) {
              // this means that the animation is queued into a digest, but
              // hasn't started yet. Therefore it is safe to run the close
              // method which will call the runner methods in async.
              existingAnimation.close();
            } else {
              // this will merge the new animation options into existing animation options
              mergeAnimationDetails(element, existingAnimation, newAnimation);

              return existingAnimation.runner;
            }
          } else {
            // a joined animation means that this animation will take over the existing one
            // so an example would involve a leave animation taking over an enter. Then when
            // the postDigest kicks in the enter will be ignored.
            const joinAnimationFlag = isAllowed(
              "join",
              newAnimation,
              existingAnimation,
            );
            if (joinAnimationFlag) {
              if (existingAnimation.state === RUNNING_STATE) {
                normalizeAnimationDetails(element, newAnimation);
              } else {
                applyGeneratedPreparationClasses(
                  element,
                  isStructural ? event : null,
                  options,
                );

                event = newAnimation.event = existingAnimation.event;
                options = mergeAnimationDetails(
                  element,
                  existingAnimation,
                  newAnimation,
                );

                // we return the same runner since only the option values of this animation will
                // be fed into the `existingAnimation`.
                return existingAnimation.runner;
              }
            }
          }
        } else {
          // normalization in this case means that it removes redundant CSS classes that
          // already exist (addClass) or do not exist (removeClass) on the element
          normalizeAnimationDetails(element, newAnimation);
        }

        // when the options are merged and cleaned up we may end up not having to do
        // an animation at all, therefore we should check this before issuing a post
        // digest callback. Structural animations will always run no matter what.
        let isValidAnimation = newAnimation.structural;
        if (!isValidAnimation) {
          // animate (from/to) can be quickly checked first, otherwise we check if any classes are present
          isValidAnimation =
            (newAnimation.event === "animate" &&
              Object.keys(newAnimation.options.to || {}).length > 0) ||
            hasAnimationClasses(newAnimation);
        }

        if (!isValidAnimation) {
          close();
          clearElementAnimationState(node);
          return runner;
        }

        // the counter keeps track of cancelled animations
        const counter = (existingAnimation.counter || 0) + 1;
        newAnimation.counter = counter;

        markElementAnimationState(node, PRE_DIGEST_STATE, newAnimation);
        $rootScope.$postUpdate(() => {
          // It is possible that the DOM nodes inside `originalElement` have been replaced. This can
          // happen if the animated element is a transcluded clone and also has a `templateUrl`
          // directive on it. Therefore, we must recreate `element` in order to interact with the
          // actual DOM nodes.
          // Note: We still need to use the old `node` for certain things, such as looking up in
          //       HashMaps where it was used as the key.

          element = stripCommentsFromElement(originalElement);

          let animationDetails = activeAnimationsLookup.get(node);
          const animationCancelled = !animationDetails;
          animationDetails = animationDetails || {};

          // if addClass/removeClass is called before something like enter then the
          // registered parent element may not be present. The code below will ensure
          // that a final value for parent element is obtained
          const parentElement = element.parentElement || [];

          // animate/structural/class-based animations all have requirements. Otherwise there
          // is no point in performing an animation. The parent node must also be set.
          const isValidAnimation =
            parentElement &&
            (animationDetails.event === "animate" ||
              animationDetails.structural ||
              hasAnimationClasses(animationDetails));

          // this means that the previous animation was cancelled
          // even if the follow-up animation is the same event
          if (
            animationCancelled ||
            animationDetails.counter !== counter ||
            !isValidAnimation
          ) {
            // if another animation did not take over then we need
            // to make sure that the domOperation and options are
            // handled accordingly
            if (animationCancelled) {
              applyAnimationClasses(element, options);
              applyAnimationStyles(element, options);
            }

            // if the event changed from something like enter to leave then we do
            // it, otherwise if it's the same then the end result will be the same too
            if (
              animationCancelled ||
              (isStructural && animationDetails.event !== event)
            ) {
              options.domOperation();
              runner.end();
            }

            // in the event that the element animation was not cancelled or a follow-up animation
            // isn't allowed to animate from here then we need to clear the state of the element
            // so that any future animations won't read the expired animation data.
            if (!isValidAnimation) {
              clearElementAnimationState(node);
            }

            return;
          }

          // this combined multiple class to addClass / removeClass into a setClass event
          // so long as a structural event did not take over the animation
          event =
            !animationDetails.structural &&
            hasAnimationClasses(animationDetails, true)
              ? "setClass"
              : animationDetails.event;

          markElementAnimationState(node, RUNNING_STATE);
          const realRunner = $$animation(
            element,
            event,
            animationDetails.options,
          );

          // this will update the runner's flow-control events based on
          // the `realRunner` object.
          runner.setHost(realRunner);
          notifyProgress(runner, event, "start", getEventData(options));

          realRunner.done((status) => {
            close(!status);
            const animationDetails = activeAnimationsLookup.get(node);
            if (animationDetails && animationDetails.counter === counter) {
              clearElementAnimationState(node);
            }
            notifyProgress(runner, event, "close", getEventData(options));
          });
        });

        return runner;

        function notifyProgress(runner, event, phase, data) {
          runInNextPostDigestOrNow(() => {
            const callbacks = findCallbacks(parentNode, node, event);
            if (callbacks.length) {
              callbacks.forEach((callback) => {
                callback(element, phase, data);
              });
              cleanupEventListeners(phase, node);
            } else {
              cleanupEventListeners(phase, node);
            }
          });
          runner.progress(event, phase, data);
        }

        function close(reject) {
          clearGeneratedClasses(element, options);
          applyAnimationClasses(element, options);
          applyAnimationStyles(element, options);
          options.domOperation();
          runner.complete(!reject);
        }
      }

      function closeChildAnimations(node) {
        const children = node.querySelectorAll(`[${NG_ANIMATE_ATTR_NAME}]`);
        children.forEach((child) => {
          const state = parseInt(child.getAttribute(NG_ANIMATE_ATTR_NAME), 10);
          const animationDetails = activeAnimationsLookup.get(child);
          if (animationDetails) {
            switch (state) {
              case RUNNING_STATE:
                animationDetails.runner.end();
              /* falls through */
              case PRE_DIGEST_STATE:
                activeAnimationsLookup.delete(child);
                break;
            }
          }
        });
      }

      function clearElementAnimationState(node) {
        node.removeAttribute(NG_ANIMATE_ATTR_NAME);
        activeAnimationsLookup.delete(node);
      }

      /**
       * This fn returns false if any of the following is true:
       * a) animations on any parent element are disabled, and animations on the element aren't explicitly allowed
       * b) a parent element has an ongoing structural animation, and animateChildren is false
       * c) the element is not a child of the body
       * d) the element is not a child of the $rootElement
       */
      function areAnimationsAllowed(node, parentNode) {
        const bodyNode = document.body;
        const rootNode = $injector.get("$rootElement");

        let bodyNodeDetected = node === bodyNode || node.nodeName === "HTML";
        let rootNodeDetected = node === rootNode;
        let parentAnimationDetected = false;
        let elementDisabled = disabledElementsLookup.get(node);
        let animateChildren;

        let parentHost = getOrSetCacheData(node, NG_ANIMATE_PIN_DATA);
        if (parentHost) {
          parentNode = parentHost;
        }

        while (parentNode) {
          if (!rootNodeDetected) {
            // AngularTS doesn't want to attempt to animate elements outside of the application
            // therefore we need to ensure that the rootElement is an ancestor of the current element
            rootNodeDetected = parentNode === rootNode;
          }

          if (parentNode.nodeType !== Node.ELEMENT_NODE) {
            // no point in inspecting the #document element
            break;
          }

          const details = activeAnimationsLookup.get(parentNode) || {};
          // either an enter, leave or move animation will commence
          // therefore we can't allow any animations to take place
          // but if a parent animation is class-based then that's ok
          if (!parentAnimationDetected) {
            const parentNodeDisabled = disabledElementsLookup.get(parentNode);

            if (parentNodeDisabled === true && elementDisabled !== false) {
              // disable animations if the user hasn't explicitly enabled animations on the
              // current element
              elementDisabled = true;
              // element is disabled via parent element, no need to check anything else
              break;
            } else if (parentNodeDisabled === false) {
              elementDisabled = false;
            }
            parentAnimationDetected = details.structural;
          }

          if (isUndefined(animateChildren) || animateChildren === true) {
            const value = getOrSetCacheData(
              parentNode,
              NG_ANIMATE_CHILDREN_DATA,
            );
            if (isDefined(value)) {
              animateChildren = value;
            }
          }

          // there is no need to continue traversing at this point
          if (parentAnimationDetected && animateChildren === false) break;

          if (!bodyNodeDetected) {
            // we also need to ensure that the element is or will be a part of the body element
            // otherwise it is pointless to even issue an animation to be rendered
            bodyNodeDetected = parentNode === bodyNode;
          }

          if (bodyNodeDetected && rootNodeDetected) {
            // If both body and root have been found, any other checks are pointless,
            // as no animation data should live outside the application
            break;
          }

          if (!rootNodeDetected) {
            // If `rootNode` is not detected, check if `parentNode` is pinned to another element
            parentHost = getOrSetCacheData(parentNode, NG_ANIMATE_PIN_DATA);
            if (parentHost) {
              // The pin target element becomes the next parent element
              parentNode = parentHost;
              continue;
            }
          }

          parentNode = parentNode.parentNode;
        }

        const allowAnimation =
          (!parentAnimationDetected || animateChildren) &&
          elementDisabled !== true;
        return allowAnimation && rootNodeDetected && bodyNodeDetected;
      }

      function markElementAnimationState(node, state, details) {
        details = details || {};
        details.state = state;

        node.setAttribute(NG_ANIMATE_ATTR_NAME, state);

        const oldValue = activeAnimationsLookup.get(node);
        const newValue = oldValue ? extend(oldValue, details) : details;
        activeAnimationsLookup.set(node, newValue);
      }
    },
  ];
}
