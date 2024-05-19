export class Attributes {
  constructor(element, attributesToCopy) {
    if (attributesToCopy) {
      const keys = Object.keys(attributesToCopy);
      for (let i = 0, l = keys.length; i < l; i++) {
        const key = keys[i];
        this[key] = attributesToCopy[key];
      }
    } else {
      this.$attr = {};
    }

    this.$$element = element;
  }

  /**
   * @ngdoc method
   * @name $compile.directive.Attributes#$normalize
   * @kind function
   *
   * @description
   * Converts an attribute name (e.g. dash/colon/underscore-delimited string, optionally prefixed with `x-` or
   * `data-`) to its normalized, camelCase form.
   *
   * Also there is special case for Moz prefix starting with upper case letter.
   *
   * For further information check out the guide on {@link guide/directive#matching-directives Matching Directives}
   *
   * @param {string} name Name to normalize
   */
  $normalize(name) {
    return directiveNormalize(name);
  }

  /**
   * @ngdoc method
   * @name $compile.directive.Attributes#$addClass
   * @kind function
   *
   * @description
   * Adds the CSS class value specified by the classVal parameter to the element. If animations
   * are enabled then an animation will be triggered for the class addition.
   *
   * @param {string} classVal The className value that will be added to the element
   */
  $addClass(classVal) {
    if (classVal && classVal.length > 0) {
      $animate.addClass(this.$$element, classVal);
    }
  }

  /**
   * @ngdoc method
   * @name $compile.directive.Attributes#$removeClass
   * @kind function
   *
   * @description
   * Removes the CSS class value specified by the classVal parameter from the element. If
   * animations are enabled then an animation will be triggered for the class removal.
   *
   * @param {string} classVal The className value that will be removed from the element
   */
  $removeClass(classVal) {
    if (classVal && classVal.length > 0) {
      $animate.removeClass(this.$$element, classVal);
    }
  }

  /**
   * @ngdoc method
   * @name $compile.directive.Attributes#$updateClass
   * @kind function
   *
   * @description
   * Adds and removes the appropriate CSS class values to the element based on the difference
   * between the new and old CSS class values (specified as newClasses and oldClasses).
   *
   * @param {string} newClasses The current CSS className value
   * @param {string} oldClasses The former CSS className value
   */
  $updateClass(newClasses, oldClasses) {
    const toAdd = tokenDifference(newClasses, oldClasses);
    if (toAdd && toAdd.length) {
      $animate.addClass(this.$$element, toAdd);
    }

    const toRemove = tokenDifference(oldClasses, newClasses);
    if (toRemove && toRemove.length) {
      $animate.removeClass(this.$$element, toRemove);
    }
  }

  /**
   * Set a normalized attribute on the element in a way such that all directives
   * can share the attribute. This function properly handles boolean attributes.
   * @param {string} key Normalized key. (ie ngAttribute)
   * @param {string|boolean} value The value to set. If `null` attribute will be deleted.
   * @param {boolean=} writeAttr If false, does not write the value to DOM element attribute.
   *     Defaults to true.
   * @param {string=} attrName Optional none normalized name. Defaults to key.
   */
  $set(key, value, writeAttr = true, attrName) {
    const node = this.$$element[0];
    const booleanKey = getBooleanAttrName(node, key);
    const aliasedKey = ALIASED_ATTR[key];
    let observer = key;
    let nodeName;

    if (booleanKey) {
      this.$$element.prop(key, value);
      attrName = booleanKey;
    } else if (aliasedKey) {
      this[aliasedKey] = value;
      observer = aliasedKey;
    }

    this[key] = value;

    if (attrName) {
      this.$attr[key] = attrName;
    } else {
      attrName = this.$attr[key];
      if (!attrName) {
        this.$attr[key] = attrName = snakeCase(key, "-");
      }
    }

    nodeName = nodeName_(this.$$element);

    if (nodeName === "img" && key === "srcset") {
      this[key] = value = sanitizeSrcset(value, "$set('srcset', value)");
    }

    if (writeAttr !== false) {
      if (value === null || isUndefined(value)) {
        this.$$element[0].removeAttribute(attrName);
      } else if (SIMPLE_ATTR_NAME.test(attrName)) {
        if (booleanKey && value === false) {
          this.$$element[0].removeAttribute(attrName);
        } else {
          this.$$element.attr(attrName, value);
        }
      } else {
        setSpecialAttr(this.$$element[0], attrName, value);
      }
    }

    const { $$observers } = this;
    if ($$observers) {
      forEach($$observers[observer], (fn) => {
        try {
          fn(value);
        } catch (e) {
          $exceptionHandler(e);
        }
      });
    }
  }

  /**
     * @ngdoc method
     * @name $compile.directive.Attributes#$observe
     * @kind function
     *
     * @description
     * Observes an interpolated attribute.
     *
     * The observer function will be invoked once during the next `$digest` following
     * compilation. The observer is then invoked whenever the interpolated value
     * changes.
     *
     * @param {string} key Normalized key. (ie ngAttribute) .
     * @param {function(interpolatedValue)} fn Function that will be called whenever
              the interpolated value of the attribute changes.
     *        See the {@link guide/interpolation#how-text-and-attribute-bindings-work Interpolation
     *        guide} for more info.
     * @returns {function()} Returns a deregistration function for this observer.
     */
  $observe(key, fn) {
    const attrs = this;
    const $$observers = attrs.$$observers || (attrs.$$observers = createMap());
    const listeners = $$observers[key] || ($$observers[key] = []);

    listeners.push(fn);
    $rootScope.$evalAsync(() => {
      if (
        !listeners.$$inter &&
        Object.prototype.hasOwnProperty.call(attrs, key) &&
        !isUndefined(attrs[key])
      ) {
        fn(attrs[key]);
      }
    });

    return function () {
      arrayRemove(listeners, fn);
    };
  }
}
