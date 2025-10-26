import { Angular } from "../../angular.js";
import { dealoc } from "../../shared/dom.js";
import { wait } from "../../shared/test-utils.js";

describe("$sse", () => {
  let sse, sseProvider, el, $compile, $scope;

  beforeEach(() => {
    el = document.getElementById("app");
    el.innerHTML = "";
    let angular = new Angular();
    angular.module("default", []).config(($sseProvider) => {
      sseProvider = $sseProvider;
    });
    angular
      .bootstrap(el, ["default"])
      .invoke((_$sse_, _$compile_, _$rootScope_) => {
        sse = _$sse_;
        $compile = _$compile_;
        $scope = _$rootScope_;
      });
  });

  afterEach(() => {
    dealoc(el);
  });

  it("should be available as provider", () => {
    expect(sseProvider).toBeDefined();
  });

  it("should be available as a serviceprovider", () => {
    expect(sse).toBeDefined();
  });

  it("should pass withCredentials to EventSource", () => {
    const source = sse("/mock/events", { withCredentials: true });
    expect(source.withCredentials).toBe(true);
    source.close();
  });

  it("should ignore headers (native EventSource limitation)", () => {
    const source = sse("/mock/events", { headers: { "X-Test": "abc" } });
    // cannot directly test headers on EventSource; just ensure no error
    expect(source).toBeDefined();
    source.close();
  });

  it("should call onOpen when connection opens", async () => {
    let opened = false;
    const source = sse("/mock/events", { onOpen: () => (opened = true) });

    await wait(50);
    expect(opened).toBe(true);

    source.close();
  });

  it("should call onMessage for incoming events", async () => {
    const received = [];
    const source = sse("/mock/events", {
      onMessage: (data) => received.push(data),
    });

    await wait(1500);
    expect(received.length).toBeGreaterThan(0);
    source.close();
  });

  it("should transform messages if transformMessage is provided", async () => {
    const transformed = [];
    const source = sse("/mock/events", {
      transformMessage: (data) => ({ raw: data }),
      onMessage: (data) => transformed.push(data),
    });

    await wait(1500);
    expect(transformed.every((d) => d.raw)).toBe(true);
    source.close();
  });

  it("should append params to the URL", () => {
    const url = "/mock/events";
    const source = sse(url, { params: { a: 1, b: "test" } });
    expect(source.url).toContain("a=1");
    expect(source.url).toContain("b=test");
    source.close();
  });

  it("should call onError on error events", async () => {
    let errored = false;
    const source = sse("/mock/events", { onError: () => (errored = true) });

    // Force an error (mock or trigger EventSource error)
    source.dispatchEvent(new Event("error"));

    expect(errored).toBe(true);
    source.close();
  });

  it("should receive initial connection message", async () => {
    let message;
    const source = sse("/mock/events", {
      onMessage: (data) => {
        message = data;
      },
    });

    await wait(50); // small delay to allow initial message
    expect(message).toBe("Connected to SSE stream");

    source.close();
  });

  it("should receive time updates every second", async () => {
    const messages = [];
    const source = sse("/mock/events", {
      onMessage: (data) => {
        messages.push(data);
      },
    });

    await wait(2500); // wait 2.5 seconds to get a couple of messages

    expect(messages.length).toBeGreaterThanOrEqual(2);

    // check format HH:MM:SS
    const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
    messages.slice(1).forEach((msg) => {
      expect(timeRegex.test(msg)).toBe(true);
    });

    source.close();
  });

  it("should close the connection cleanly", async () => {
    const messages = [];
    const source = sse("/mock/events", {
      onMessage: (data) => messages.push(data),
    });

    await wait(1500);
    source.close();

    const countBefore = messages.length;
    await wait(1500); // wait more time, should not get new messages
    expect(messages.length).toBe(countBefore);
  });
});
