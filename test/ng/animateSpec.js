describe("$animate", () => {
  describe("without animation", () => {
    let element;
    let $rootElement;

    beforeEach(
      module(
        () =>
          function ($compile, _$rootElement_, $rootScope) {
            element = $compile("<div></div>")($rootScope);
            $rootElement = _$rootElement_;
          },
      ),
    );

    it("should add element at the start of enter animation", () => {
      const child = $compile("<div></div>")($rootScope);
      expect(element.contents().length).toBe(0);
      $animate.enter(child, element);
      expect(element.contents().length).toBe(1);
    });

    it("should enter the element to the start of the parent container", () => {
      for (let i = 0; i < 5; i++) {
        element.append(jqLite(`<div> ${i}</div>`));
      }

      const child = jqLite("<div>first</div>");
      $animate.enter(child, element);

      expect(element.text()).toEqual("first 0 1 2 3 4");
    });

    it("should remove the element at the end of leave animation", () => {
      const child = $compile("<div></div>")($rootScope);
      element.append(child);
      expect(element.contents().length).toBe(1);
      $animate.leave(child);
      expect(element.contents().length).toBe(0);
    });

    it("should reorder the move animation", () => {
      const child1 = $compile("<div>1</div>")($rootScope);
      const child2 = $compile("<div>2</div>")($rootScope);
      element.append(child1);
      element.append(child2);
      expect(element.text()).toBe("12");
      $animate.move(child1, element, child2);
      expect(element.text()).toBe("21");
    });

    it("should apply styles instantly to the element", () => {
      $animate.animate(element, { color: "rgb(0, 0, 0)" });
      expect(element.css("color")).toBe("rgb(0, 0, 0)");

      $animate.animate(
        element,
        { color: "rgb(255, 0, 0)" },
        { color: "rgb(0, 255, 0)" },
      );
      expect(element.css("color")).toBe("rgb(0, 255, 0)");
    });

    it("should still perform DOM operations even if animations are disabled (post-digest)", () => {
      $animate.enabled(false);
      expect(element).toBeShown();
      $animate.addClass(element, "ng-hide");
      $rootScope.$digest();
      expect(element).toBeHidden();
    });

    it("should run each method and return a promise", () => {
      const element = jqLite("<div></div>");
      const move = jqLite("<div></div>");
      const parent = jqLite($document[0].body);
      parent.append(move);

      expect($animate.enter(element, parent)).toBeAPromise();
      expect($animate.move(element, move)).toBeAPromise();
      expect($animate.addClass(element, "on")).toBeAPromise();
      expect($animate.removeClass(element, "off")).toBeAPromise();
      expect($animate.setClass(element, "on", "off")).toBeAPromise();
      expect($animate.leave(element)).toBeAPromise();
    });

    it("should provide the `enabled` and `cancel` methods", () => {
      expect($animate.enabled()).toBeUndefined();
      expect($animate.cancel({})).toBeUndefined();
    });

    it("should provide the `on` and `off` methods", () => {
      expect(isFunction($animate.on)).toBe(true);
      expect(isFunction($animate.off)).toBe(true);
    });

    it("should add and remove classes on SVG elements", () => {
      if (!window.SVGElement) return;
      const svg = jqLite("<svg><rect></rect></svg>");
      const rect = svg.children();
      $animate.enabled(false);
      expect(rect).toBeShown();
      $animate.addClass(rect, "ng-hide");
      $rootScope.$digest();
      expect(rect).toBeHidden();
      $animate.removeClass(rect, "ng-hide");
      $rootScope.$digest();
      expect(rect).not.toBeHidden();
    });

    it("should throw error on wrong selector", () => {
      module(($animateProvider) => {
        expect(() => {
          $animateProvider.register("abc", null);
        }).toThrow(
          "$animate",
          "notcsel",
          "Expecting class selector starting with '.' got 'abc'.",
        );
      });
    });

    it("should register the animation and be available for lookup", () => {
      let provider;
      module(($animateProvider) => {
        provider = $animateProvider;
      });
      () => {
        // by using hasOwnProperty we know for sure that the lookup object is an empty object
        // instead of inheriting properties from its original prototype.
        expect(provider.$$registeredAnimations.hasOwnProperty).toBeFalsy();

        provider.register(".filter", () => {});
        expect(provider.$$registeredAnimations.filter).toBe(
          ".filter-animation",
        );
      };
    });

    it("should apply and retain inline styles on the element that is animated", () => {
      const element = jqLite("<div></div>");
      const parent = jqLite("<div></div>");
      const other = jqLite("<div></div>");
      parent.append(other);
      $animate.enabled(true);

      $animate.enter(element, parent, null, {
        to: { color: "red" },
      });
      assertColor("red");

      $animate.move(element, null, other, {
        to: { color: "yellow" },
      });
      assertColor("yellow");

      $animate.addClass(element, "on", {
        to: { color: "green" },
      });
      $rootScope.$digest();
      assertColor("green");

      $animate.setClass(element, "off", "on", {
        to: { color: "black" },
      });
      $rootScope.$digest();
      assertColor("black");

      $animate.removeClass(element, "off", {
        to: { color: "blue" },
      });
      $rootScope.$digest();
      assertColor("blue");

      $animate.leave(element, {
        to: { color: "yellow" },
      });
      $rootScope.$digest();
      assertColor("yellow");

      function assertColor(color) {
        expect(element[0].style.color).toBe(color);
      }
    });

    it("should merge the from and to styles that are provided", () => {
      const element = jqLite("<div></div>");

      element.css("color", "red");
      $animate.addClass(element, "on", {
        from: { color: "green" },
        to: { borderColor: "purple" },
      });
      $rootScope.$digest();

      const { style } = element[0];
      expect(style.color).toBe("green");
      expect(style.borderColor).toBe("purple");
    });

    it("should avoid cancelling out add/remove when the element already contains the class", () => {
      const element = jqLite('<div class="ng-hide"></div>');

      $animate.addClass(element, "ng-hide");
      $animate.removeClass(element, "ng-hide");
      $rootScope.$digest();

      expect(element).not.toHaveClass("ng-hide");
    });

    it("should avoid cancelling out remove/add if the element does not contain the class", () => {
      const element = jqLite("<div></div>");

      $animate.removeClass(element, "ng-hide");
      $animate.addClass(element, "ng-hide");
      $rootScope.$digest();

      expect(element).toHaveClass("ng-hide");
    });

    ["enter", "move"].forEach((method) => {
      it('should accept an unwrapped "parent" element for the $prop event', () => {
        const element = jqLite("<div></div>");
        const parent = $document[0].createElement("div");
        $rootElement.append(parent);

        $animate[method](element, parent);
        expect(element[0].parentNode).toBe(parent);
      });
    });

    ["enter", "move"].forEach((method) => {
      it('should accept an unwrapped "after" element for the $prop event', () => {
        const element = jqLite("<div></div>");
        const after = $document[0].createElement("div");
        $rootElement.append(after);

        $animate[method](element, null, after);
        expect(element[0].previousSibling).toBe(after);
      });
    });

    [
      "enter",
      "move",
      "leave",
      "addClass",
      "removeClass",
      "setClass",
      "animate",
    ].forEach((event) => {
      it("$prop() should operate using a native DOM element", () => {
        const captureSpy = jasmine.createSpy();

        module(($provide) => {
          $provide.value("$$animateQueue", {
            push: captureSpy,
          });
        });

        const element = jqLite("<div></div>");
        const parent2 = jqLite("<div></div>");
        const parent = $rootElement;
        parent.append(parent2);

        if (event !== "enter" && event !== "move") {
          parent.append(element);
        }

        let fn;
        const invalidOptions = function () {};

        switch (event) {
          case "enter":
          case "move":
            fn = function () {
              $animate[event](element, parent, parent2, invalidOptions);
            };
            break;

          case "addClass":
            fn = function () {
              $animate.addClass(element, "klass", invalidOptions);
            };
            break;

          case "removeClass":
            element.className = "klass";
            fn = function () {
              $animate.removeClass(element, "klass", invalidOptions);
            };
            break;

          case "setClass":
            element.className = "two";
            fn = function () {
              $animate.setClass(element, "one", "two", invalidOptions);
            };
            break;

          case "leave":
            fn = function () {
              $animate.leave(element, invalidOptions);
            };
            break;

          case "animate":
            const toStyles = { color: "red" };
            fn = function () {
              $animate.animate(element, {}, toStyles, "klass", invalidOptions);
            };
            break;
        }

        expect(() => {
          fn();
          $rootScope.$digest();
        }).not.toThrow();

        const optionsArg = captureSpy.calls.mostRecent().args[2];
        expect(optionsArg).not.toBe(invalidOptions);
        expect(isObject(optionsArg)).toBeTruthy();
      });
    });
  });

  it("should not issue a call to addClass if the provided class value is not a string or array", () => {
    () => {
      const spy = spyOn(window, "jqLiteAddClass").and.callThrough();

      const element = jqLite("<div></div>");
      const parent = $rootElement;

      $animate.enter(element, parent, null, { addClass: () => {} });
      $rootScope.$digest();
      expect(spy).not.toHaveBeenCalled();

      $animate.leave(element, { addClass: true });
      $rootScope.$digest();
      expect(spy).not.toHaveBeenCalled();

      $animate.enter(element, parent, null, { addClass: "fatias" });
      $rootScope.$digest();
      expect(spy).toHaveBeenCalled();
    };
  });

  it("should not break postDigest for subsequent elements if addClass contains non-valid CSS class names", () => {
    const element1 = jqLite("<div></div>");
    const element2 = jqLite("<div></div>");

    $animate.enter(element1, $rootElement, null, { addClass: " " });
    $animate.enter(element2, $rootElement, null, { addClass: "valid-name" });
    $rootScope.$digest();

    expect(
      element2[0].classList.contains(ist.contains("valid-name")),
    ).toBeTruthy();
  });

  it("should not issue a call to removeClass if the provided class value is not a string or array", () => {
    () => {
      const spy = spyOn(window, "jqLiteRemoveClass").and.callThrough();

      const element = jqLite("<div></div>");
      const parent = $rootElement;

      $animate.enter(element, parent, null, { removeClass: () => {} });
      $rootScope.$digest();
      expect(spy).not.toHaveBeenCalled();

      $animate.leave(element, { removeClass: true });
      $rootScope.$digest();
      expect(spy).not.toHaveBeenCalled();

      element.addClass("fatias");
      $animate.enter(element, parent, null, { removeClass: "fatias" });
      $rootScope.$digest();
      expect(spy).toHaveBeenCalled();
    };
  });

  it("should not alter the provided options input in any way throughout the animation", () => {
    const element = jqLite("<div></div>");
    const parent = $rootElement;

    const initialOptions = {
      from: { height: "50px" },
      to: { width: "50px" },
      addClass: "one",
      removeClass: "two",
    };

    const copiedOptions = structuredClone(initialOptions);
    expect(copiedOptions).toEqual(initialOptions);

    const runner = $animate.enter(element, parent, null, copiedOptions);
    expect(copiedOptions).toEqual(initialOptions);

    $rootScope.$digest();
    expect(copiedOptions).toEqual(initialOptions);
  });

  describe("CSS class DOM manipulation", () => {
    let element;
    let addClass;
    let removeClass;

    afterEach(() => {
      dealoc(element);
    });

    function setupClassManipulationSpies() {
      () => {
        addClass = spyOn(window, "jqLiteAddClass").and.callThrough();
        removeClass = spyOn(window, "jqLiteRemoveClass").and.callThrough();
      };
    }

    function setupClassManipulationLogger(log) {
      () => {
        const _addClass = jqLiteAddClass;
        addClass = spyOn(window, "jqLiteAddClass").and.callFake(
          (element, classes) => {
            let names = classes;
            if (Object.prototype.toString.call(classes) === "[object Array]")
              names = classes.join(" ");
            log(`addClass(${names})`);
            return _addClass(element, classes);
          },
        );

        const _removeClass = jqLiteRemoveClass;
        removeClass = spyOn(window, "jqLiteRemoveClass").and.callFake(
          (element, classes) => {
            let names = classes;
            if (Object.prototype.toString.call(classes) === "[object Array]")
              names = classes.join(" ");
            log(`removeClass(${names})`);
            return _removeClass(element, classes);
          },
        );
      };
    }

    it("should defer class manipulation until end of digest", () => {
      setupClassManipulationLogger(log);
      element = jqLite("<p>test</p>");

      $rootScope.$apply(() => {
        $animate.addClass(element, "test-class1");
        expect(element).not.toHaveClass("test-class1");

        $animate.removeClass(element, "test-class1");

        $animate.addClass(element, "test-class2");
        expect(element).not.toHaveClass("test-class2");

        $animate.setClass(element, "test-class3", "test-class4");
        expect(element).not.toHaveClass("test-class3");
        expect(element).not.toHaveClass("test-class4");
        expect(log).toEqual([]);
      });

      expect(element).not.toHaveClass("test-class1");
      expect(element).not.toHaveClass("test-class4");
      expect(element).toHaveClass("test-class2");
      expect(element).toHaveClass("test-class3");
      expect(log).toEqual(["addClass(test-class2 test-class3)"]);
      expect(addClass).toHaveBeenCalledTimes(1);
      expect(removeClass).not.toHaveBeenCalled();
    });

    it("should defer class manipulation until postDigest when outside of digest", () => {
      setupClassManipulationLogger(log);
      element = jqLite('<p class="test-class4">test</p>');

      $animate.addClass(element, "test-class1");
      $animate.removeClass(element, "test-class1");
      $animate.addClass(element, "test-class2");
      $animate.setClass(element, "test-class3", "test-class4");

      expect(log).toEqual([]);
      $rootScope.$digest();

      expect(log).toEqual([
        "addClass(test-class2 test-class3)",
        "removeClass(test-class4)",
      ]);
      expect(element).not.toHaveClass("test-class1");
      expect(element).toHaveClass("test-class2");
      expect(element).toHaveClass("test-class3");
      expect(addClass).toHaveBeenCalledTimes(1);
      expect(removeClass).toHaveBeenCalledTimes(1);
    });

    it("should perform class manipulation in expected order at end of digest", () => {
      element = jqLite('<p class="test-class3">test</p>');

      setupClassManipulationLogger(log);

      $rootScope.$apply(() => {
        $animate.addClass(element, "test-class1");
        $animate.addClass(element, "test-class2");
        $animate.removeClass(element, "test-class1");
        $animate.removeClass(element, "test-class3");
        $animate.addClass(element, "test-class3");
      });
      expect(log).toEqual(["addClass(test-class2)"]);
    });

    it("should return a promise which is resolved on a different turn", () => {
      element = jqLite('<p class="test2">test</p>');

      $animate.addClass(element, "test1").then(log.fn("addClass(test1)"));
      $animate.removeClass(element, "test2").then(log.fn("removeClass(test2)"));

      $rootScope.$digest();
      expect(log).toEqual([]);
      $$rAF.flush();
      $rootScope.$digest();
      expect(log).toEqual(["addClass(test1)", "removeClass(test2)"]);

      log.reset();
      element = jqLite('<p class="test4">test</p>');

      $rootScope.$apply(() => {
        $animate.addClass(element, "test3").then(log.fn("addClass(test3)"));
        $animate
          .removeClass(element, "test4")
          .then(log.fn("removeClass(test4)"));
      });

      $$rAF.flush();
      $rootScope.$digest();
      expect(log).toEqual(["addClass(test3)", "removeClass(test4)"]);
    });

    it("should defer class manipulation until end of digest for SVG", () => {
      if (!window.SVGElement) return;
      setupClassManipulationSpies();
      element = jqLite("<svg><g></g></svg>");
      const target = element.children().eq(0);

      $rootScope.$apply(() => {
        $animate.addClass(target, "test-class1");
        expect(target).not.toHaveClass("test-class1");

        $animate.removeClass(target, "test-class1");

        $animate.addClass(target, "test-class2");
        expect(target).not.toHaveClass("test-class2");

        $animate.setClass(target, "test-class3", "test-class4");
        expect(target).not.toHaveClass("test-class3");
        expect(target).not.toHaveClass("test-class4");
      });

      expect(target).not.toHaveClass("test-class1");
      expect(target).toHaveClass("test-class2");
      expect(addClass).toHaveBeenCalledTimes(1);
      expect(removeClass).not.toHaveBeenCalled();
    });

    it("should defer class manipulation until postDigest when outside of digest for SVG", () => {
      if (!window.SVGElement) return;
      setupClassManipulationLogger(log);
      element = jqLite('<svg><g class="test-class4"></g></svg>');
      const target = element.children().eq(0);

      $animate.addClass(target, "test-class1");
      $animate.removeClass(target, "test-class1");
      $animate.addClass(target, "test-class2");
      $animate.setClass(target, "test-class3", "test-class4");

      expect(log).toEqual([]);
      $rootScope.$digest();

      expect(log).toEqual([
        "addClass(test-class2 test-class3)",
        "removeClass(test-class4)",
      ]);
      expect(target).not.toHaveClass("test-class1");
      expect(target).toHaveClass("test-class2");
      expect(target).toHaveClass("test-class3");
      expect(addClass).toHaveBeenCalledTimes(1);
      expect(removeClass).toHaveBeenCalledTimes(1);
    });

    it("should perform class manipulation in expected order at end of digest for SVG", () => {
      if (!window.SVGElement) return;
      element = jqLite('<svg><g class="test-class3"></g></svg>');
      const target = element.children().eq(0);

      setupClassManipulationLogger(log);

      $rootScope.$apply(() => {
        $animate.addClass(target, "test-class1");
        $animate.addClass(target, "test-class2");
        $animate.removeClass(target, "test-class1");
        $animate.removeClass(target, "test-class3");
        $animate.addClass(target, "test-class3");
      });
      expect(log).toEqual(["addClass(test-class2)"]);
    });
  });
});
