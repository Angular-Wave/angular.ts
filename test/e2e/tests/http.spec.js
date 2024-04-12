describe("$http", () => {
  beforeEach(() => {
    loadFixture("http");
  });

  it("should correctly update the outstanding request count", () => {
    expect(element(by.binding("text")).getText()).toBe("Hello, world!");
  });
});
