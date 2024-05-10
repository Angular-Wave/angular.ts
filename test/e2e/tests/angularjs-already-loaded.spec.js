describe("App where AngularJS is loaded more than once", () => {
  beforeEach(() => {
    loadFixture("angularjs-already-loaded");
  });

  it("should have the interpolated text", () => {
    expect(element(by.binding("text")).getText()).toBe("Hello, world!");
  });
});
