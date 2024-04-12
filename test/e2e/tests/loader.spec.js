describe("angular-loader", () => {
  beforeEach(() => {
    loadFixture("loader");
  });

  it("should not be broken by loading the modules before core", () => {
    expect(element(by.binding("text")).getText()).toBe("Hello, world!");
  });
});
