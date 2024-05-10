describe("SCE URL policy when base tags are present", () => {
  beforeEach(() => {
    loadFixture("base-tag");
  });

  it("allows the page URL (location.href)", () => {
    expectToBeTrusted(browser.getCurrentUrl(), true);
  });

  it("blocks off-origin URLs", () => {
    expectToBeTrusted("http://evil.com", false);
  });

  it('allows relative URLs ("/relative")', () => {
    expectToBeTrusted("/relative", true);
  });

  it("allows absolute URLs from the base origin", () => {
    expectToBeTrusted("http://www.example.com/path/to/file.html", true);
  });

  it("tracks changes to the base URL", () => {
    browser.executeScript(
      'document.getElementsByTagName("base")[0].href = "http://xxx.example.com/";',
    );
    expectToBeTrusted("http://xxx.example.com/path/to/file.html", true);
    expectToBeTrusted("http://www.example.com/path/to/file.html", false);
  });

  // Helpers
  function expectToBeTrusted(url, isTrusted) {
    const urlIsTrusted = browser.executeScript(
      "return isTrustedUrl(arguments[0])",
      url,
    );
    expect(urlIsTrusted).toBe(isTrusted);
  }
});
