// Sample E2E test:
describe("Sample", () => {
  beforeEach(() => {
    loadFixture("sample");
  });

  it("should have the interpolated text", () => {
    expect(element(by.binding("text")).getText()).toBe("Hello, world!");
  });

  it("should insert the ng-cloak styles", () => {
    browser.executeScript(`
      let span = document.createElement('span');
      span.className = 'ng-cloak foo';
      document.body.appendChild(span);
    `);
    expect(element(by.className("foo")).isDisplayed()).toBe(false);
  });
});
