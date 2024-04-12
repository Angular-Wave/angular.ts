describe("Firing a callback on ready", () => {
  it("should not have the div available immediately", () => {
    loadFixture("ready");
    expect(element(by.className("before-ready")).getText()).toBe("");
  });

  it("should wait for document ready", () => {
    loadFixture("ready");
    expect(element(by.className("after-ready")).getText()).toBe(
      "This div is loaded after scripts.",
    );
    expect(element(by.className("after-ready-method")).getText()).toBe(
      "This div is loaded after scripts.",
    );
  });

  it("should be asynchronous", () => {
    loadFixture("ready");
    expect(element(by.className("after-ready-sync")).getText()).toBe("");
    expect(element(by.className("after-ready-method-sync")).getText()).toBe("");
  });
});
