import { NgModule } from "./ng-module";

describe("NgModule", () => {
  it("can be instantiated", () => {
    let ngModule = new NgModule("test", []);
    expect(ngModule).toBeDefined();
    expect(ngModule.name).toBeDefined();
    expect(ngModule.requires).toBeDefined();
  });

  it("can't be instantiated without name or dependencies", () => {
    expect(() => new NgModule()).toThrowError();
    expect(() => new NgModule("test")).toThrowError();
  });
});
