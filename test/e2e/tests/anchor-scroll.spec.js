describe("$anchorScroll", () => {
  beforeEach(() => {
    jasmine.addMatchers({
      toBeInViewport() {
        return {
          compare(id) {
            const result = {
              pass: browser.driver
                .executeScript(_script_isInViewport, id)
                .then((isInViewport) => {
                  result.message = `Expected #${id}${
                    isInViewport ? " not" : ""
                  } to be in viewport`;
                  return isInViewport;
                }),
            };

            return result;
          },
        };
      },
      toHaveTop() {
        return {
          compare(id, expectedTop) {
            const result = {
              pass: browser.driver
                .executeScript(_script_getTop, id)
                .then((actualTop) => {
                  // Some browsers may report have +/-1 pixel deviation
                  const passed = Math.abs(expectedTop - actualTop) <= 1;
                  result.message = `Expected #${id}'s top${
                    passed ? " not" : ""
                  } to be ${expectedTop}, but it was ${actualTop}`;
                  return passed;
                }),
            };

            return result;
          },
        };
      },
    });
  });

  describe("basic functionality", () => {
    beforeEach(() => {
      loadFixture("anchor-scroll");
    });

    it("should scroll to #bottom when clicking #top and vice versa", () => {
      expect("top").toBeInViewport();
      expect("bottom").not.toBeInViewport();

      element(by.id("top")).click();
      expect("top").not.toBeInViewport();
      expect("bottom").toBeInViewport();

      element(by.id("bottom")).click();
      expect("top").toBeInViewport();
      expect("bottom").not.toBeInViewport();
    });
  });

  describe("with `yOffset`", () => {
    const yOffset = 50;
    const buttons = element.all(by.repeater("x in [1, 2, 3, 4, 5]"));
    const anchors = element.all(by.repeater("y in [1, 2, 3, 4, 5]"));

    beforeEach(() => {
      loadFixture("anchor-scroll-y-offset");
    });

    it("should scroll to the correct anchor when clicking each button", () => {
      const lastAnchor = anchors.last();

      // Make sure there is enough room to scroll the last anchor to the top
      lastAnchor.getSize().then((size) => {
        const tempHeight = size.height - 10;

        execWithTempViewportHeight(tempHeight, () => {
          buttons.each((button, idx) => {
            // For whatever reason, we need to run the assertions inside a callback :(
            button.click().then(() => {
              const anchorId = `anchor-${idx + 1}`;

              expect(anchorId).toBeInViewport();
              expect(anchorId).toHaveTop(yOffset);
            });
          });
        });
      });
    });

    it("should automatically scroll when navigating to a URL with a hash", () => {
      const lastAnchor = anchors.last();
      const lastAnchorId = "anchor-5";

      // Make sure there is enough room to scroll the last anchor to the top
      lastAnchor.getSize().then((size) => {
        const tempHeight = size.height - 10;

        execWithTempViewportHeight(tempHeight, () => {
          // Test updating `$location.url()` from within the app
          expect(lastAnchorId).not.toBeInViewport();

          browser.setLocation(`#${lastAnchorId}`);
          expect(lastAnchorId).toBeInViewport();
          expect(lastAnchorId).toHaveTop(yOffset);

          // Test navigating to the URL directly
          scrollToTop();
          expect(lastAnchorId).not.toBeInViewport();

          browser.refresh();
          expect(lastAnchorId).toBeInViewport();
          expect(lastAnchorId).toHaveTop(yOffset);
        });
      });
    });

    it('should not scroll "overzealously"', () => {
      const lastButton = buttons.last();
      const lastAnchor = anchors.last();
      const lastAnchorId = "anchor-5";

      if (browser.params.browser === "firefox") return;

      // Make sure there is not enough room to scroll the last anchor to the top
      lastAnchor.getSize().then((size) => {
        const tempHeight = size.height + yOffset / 2;

        execWithTempViewportHeight(tempHeight, () => {
          scrollIntoView(lastAnchorId);
          expect(lastAnchorId).toHaveTop(yOffset / 2);

          lastButton.click();
          expect(lastAnchorId).toBeInViewport();
          expect(lastAnchorId).toHaveTop(yOffset);
        });
      });
    });
  });

  // Helpers
  // Those are scripts executed in the browser, stop complaining about
  // `document` not being defined.
  /* eslint-disable no-undef */
  function _script_getTop(id) {
    const elem = document.getElementById(id);
    const rect = elem.getBoundingClientRect();

    return rect.top;
  }

  function _script_isInViewport(id) {
    const elem = document.getElementById(id);
    const rect = elem.getBoundingClientRect();
    const docElem = document.documentElement;

    return (
      rect.top < docElem.clientHeight &&
      rect.bottom > 0 &&
      rect.left < docElem.clientWidth &&
      rect.right > 0
    );
  }
  /* eslint-enable */

  function execWithTempViewportHeight(tempHeight, fn) {
    setViewportHeight(tempHeight).then((oldHeight) => {
      fn();
      setViewportHeight(oldHeight);
    });
  }

  function scrollIntoView(id) {
    browser.driver.executeScript(
      `document.getElementById("${id}").scrollIntoView()`,
    );
  }

  function scrollToTop() {
    browser.driver.executeScript("window.scrollTo(0, 0)");
  }

  function setViewportHeight(newHeight) {
    return browser.driver
      .executeScript("return document.documentElement.clientHeight")
      .then((oldHeight) => {
        const heightDiff = newHeight - oldHeight;
        const win = browser.driver.manage().window();

        return win
          .getSize()
          .then((size) =>
            win
              .setSize(size.width, size.height + heightDiff)
              .then(() => oldHeight),
          );
      });
  }
});
