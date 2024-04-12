describe("Customizing the jqLite / jQuery version", () => {
  it("should be able to force jqLite", () => {
    loadFixture("ng-jq");
    expect(element(by.binding("jqueryVersion")).getText()).toBe("jqLite");
  });

  it("should be able to use a specific version jQuery", () => {
    loadFixture("ng-jq-jquery");
    expect(element(by.binding("jqueryVersion")).getText()).toBe("2.1.0");
  });
});
