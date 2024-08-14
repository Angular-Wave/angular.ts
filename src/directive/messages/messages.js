import { forEach, isString } from "../../shared/utils";

ngMessagesDirective.$inject = ["$animate"];
export function ngMessagesDirective($animate) {
  const ACTIVE_CLASS = "ng-active";
  const INACTIVE_CLASS = "ng-inactive";
  return {
    require: "ngMessages",
    restrict: "AE",
    controller: function ($element, $scope, $attrs) {
      const ctrl = this;
      let latestKey = 0;
      let nextAttachId = 0;
      this.head = undefined;
      this.default = undefined;

      this.getAttachId = function getAttachId() {
        return nextAttachId++;
      };

      const messages = (this.messages = {});
      let renderLater;
      let cachedCollection;

      this.render = function (collection) {
        collection = collection || {};

        renderLater = false;
        cachedCollection = collection;

        // this is true if the attribute is empty or if the attribute value is truthy
        const multiple =
          isAttrTruthy($scope, $attrs.ngMessagesMultiple) ||
          isAttrTruthy($scope, $attrs.multiple);

        const unmatchedMessages = [];
        const matchedKeys = {};
        let truthyKeys = 0;
        let messageItem = ctrl.head;
        let messageFound = false;
        let totalMessages = 0;

        // we use != instead of !== to allow for both undefined and null values
        while (messageItem != null) {
          totalMessages++;
          const messageCtrl = messageItem.message;

          let messageUsed = false;
          if (!messageFound) {
            forEach(collection, (value, key) => {
              if (truthy(value) && !messageUsed) {
                truthyKeys++;

                if (messageCtrl.test(key)) {
                  // this is to prevent the same error name from showing up twice
                  if (matchedKeys[key]) return;
                  matchedKeys[key] = true;

                  messageUsed = true;
                  messageCtrl.attach();
                }
              }
            });
          }

          if (messageUsed) {
            // unless we want to display multiple messages then we should
            // set a flag here to avoid displaying the next message in the list
            messageFound = !multiple;
          } else {
            unmatchedMessages.push(messageCtrl);
          }

          messageItem = messageItem.next;
        }

        forEach(unmatchedMessages, (messageCtrl) => {
          messageCtrl.detach();
        });

        const messageMatched = unmatchedMessages.length !== totalMessages;
        const attachDefault = ctrl.default && !messageMatched && truthyKeys > 0;

        if (attachDefault) {
          ctrl.default.attach();
        } else if (ctrl.default) {
          ctrl.default.detach();
        }

        if (messageMatched || attachDefault) {
          $animate.setClass($element, ACTIVE_CLASS, INACTIVE_CLASS);
        } else {
          $animate.setClass($element, INACTIVE_CLASS, ACTIVE_CLASS);
        }
      };

      $scope.$watchCollection($attrs.ngMessages || $attrs.for, ctrl.render);

      this.reRender = function () {
        if (!renderLater) {
          renderLater = true;
          $scope.$evalAsync(() => {
            if (renderLater && cachedCollection) {
              ctrl.render(cachedCollection);
            }
          });
        }
      };

      this.register = function (comment, messageCtrl, isDefault) {
        if (isDefault) {
          ctrl.default = messageCtrl;
        } else {
          const nextKey = latestKey.toString();
          messages[nextKey] = {
            message: messageCtrl,
          };
          insertMessageNode($element[0], comment, nextKey);
          comment.$$ngMessageNode = nextKey;
          latestKey++;
        }

        ctrl.reRender();
      };

      this.deregister = function (comment, isDefault) {
        if (isDefault) {
          delete ctrl.default;
        } else {
          const key = comment.$$ngMessageNode;
          delete comment.$$ngMessageNode;
          removeMessageNode($element[0], comment, key);
          delete messages[key];
        }
        ctrl.reRender();
      };

      function findPreviousMessage(parent, comment) {
        let prevNode = comment;
        const parentLookup = [];

        while (prevNode && prevNode !== parent) {
          const prevKey = prevNode.$$ngMessageNode;
          if (prevKey && prevKey.length) {
            return messages[prevKey];
          }

          // dive deeper into the DOM and examine its children for any ngMessage
          // comments that may be in an element that appears deeper in the list
          if (
            prevNode.childNodes.length &&
            parentLookup.indexOf(prevNode) === -1
          ) {
            parentLookup.push(prevNode);
            prevNode = prevNode.childNodes[prevNode.childNodes.length - 1];
          } else if (prevNode.previousSibling) {
            prevNode = prevNode.previousSibling;
          } else {
            prevNode = prevNode.parentNode;
            parentLookup.push(prevNode);
          }
        }
      }

      function insertMessageNode(parent, comment, key) {
        const messageNode = messages[key];
        if (!ctrl.head) {
          ctrl.head = messageNode;
        } else {
          const match = findPreviousMessage(parent, comment);
          if (match) {
            messageNode.next = match.next;
            match.next = messageNode;
          } else {
            messageNode.next = ctrl.head;
            ctrl.head = messageNode;
          }
        }
      }

      function removeMessageNode(parent, comment, key) {
        const messageNode = messages[key];

        // This message node may have already been removed by a call to deregister()
        if (!messageNode) return;

        const match = findPreviousMessage(parent, comment);
        if (match) {
          match.next = messageNode.next;
        } else {
          ctrl.head = messageNode.next;
        }
      }
    },
  };
}

function isAttrTruthy(scope, attr) {
  return (
    (isString(attr) && attr.length === 0) || // empty attribute
    truthy(scope.$eval(attr))
  );
}

function truthy(val) {
  return isString(val) ? val.length : !!val;
}

ngMessagesIncludeDirective.$inject = ["$templateRequest", "$compile"];
export function ngMessagesIncludeDirective($templateRequest, $compile) {
  return {
    restrict: "AE",
    require: "^^ngMessages", // we only require this for validation sake
    link($scope, element, attrs) {
      const src = attrs.ngMessagesInclude || attrs.src;
      $templateRequest(src).then((html) => {
        if ($scope.$$destroyed) return;
        if (isString(html) && !html.trim()) {
          // Empty template - nothing to compile
        } else {
          // Non-empty template - compile and link
          $compile(html)($scope, (contents) => {
            element.after(contents);
          });
        }
      });
    },
  };
}

export const ngMessageDirective = ngMessageDirectiveFactory(false);
export const ngMessageExpDirective = ngMessageDirectiveFactory(false);
export const ngMessageDefaultDirective = ngMessageDirectiveFactory(true);

function ngMessageDirectiveFactory(isDefault) {
  ngMessageDirective.$inject = ["$animate"];
  function ngMessageDirective($animate) {
    return {
      restrict: "AE",
      transclude: "element",
      priority: 1, // must run before ngBind, otherwise the text is set on the comment
      terminal: true,
      require: "^^ngMessages",
      link(scope, element, attrs, ngMessagesCtrl, $transclude) {
        let commentNode;
        let records;
        let staticExp;
        let dynamicExp;

        if (!isDefault) {
          commentNode = element[0];
          staticExp = attrs.ngMessage || attrs.when;
          dynamicExp = attrs.ngMessageExp || attrs.whenExp;

          const assignRecords = function (items) {
            records = items
              ? Array.isArray(items)
                ? items
                : items.split(/[\s,]+/)
              : null;
            ngMessagesCtrl.reRender();
          };

          if (dynamicExp) {
            assignRecords(scope.$eval(dynamicExp));
            scope.$watchCollection(dynamicExp, assignRecords);
          } else {
            assignRecords(staticExp);
          }
        }

        let currentElement;
        let messageCtrl;
        ngMessagesCtrl.register(
          commentNode,
          (messageCtrl = {
            test(name) {
              return contains(records, name);
            },
            attach() {
              if (!currentElement) {
                $transclude((elm, newScope) => {
                  $animate.enter(elm, null, element);
                  currentElement = elm;

                  // Each time we attach this node to a message we get a new id that we can match
                  // when we are destroying the node later.
                  const $$attachId = (currentElement.$$attachId =
                    ngMessagesCtrl.getAttachId());

                  // in the event that the element or a parent element is destroyed
                  // by another structural directive then it's time
                  // to deregister the message from the controller
                  currentElement.on("$destroy", () => {
                    // If the message element was removed via a call to `detach` then `currentElement` will be null
                    // So this handler only handles cases where something else removed the message element.
                    if (
                      currentElement &&
                      currentElement.$$attachId === $$attachId
                    ) {
                      ngMessagesCtrl.deregister(commentNode, isDefault);
                      messageCtrl.detach();
                    }
                    newScope.$destroy();
                  });
                });
              }
            },
            detach() {
              if (currentElement) {
                const elm = currentElement;
                currentElement = null;
                $animate.leave(elm);
              }
            },
          }),
          isDefault,
        );

        // We need to ensure that this directive deregisters itself when it no longer exists
        // Normally this is done when the attached element is destroyed; but if this directive
        // gets removed before we attach the message to the DOM there is nothing to watch
        // in which case we must deregister when the containing scope is destroyed.
        scope.$on("$destroy", () => {
          ngMessagesCtrl.deregister(commentNode, isDefault);
        });
      },
    };
  }
  return ngMessageDirective;
}

function contains(collection, key) {
  if (collection) {
    return Array.isArray(collection)
      ? collection.indexOf(key) >= 0
      : Object.prototype.hasOwnProperty.call(collection, key);
  }
}
